import { Point, scale, minus, plus,  Vector, Angle, getAngle, calculateVector, rotate, StraightLine, isLeftOf } from '../math'
import * as nnMath from '../neuralnet/math' // TODO: union math libraries..
import {Dock, AngleType, HasState, Limitable} from './world'
import {Lesson} from '../neuralnet/lesson';

import {expect} from 'chai';


export class Truck implements HasState, Limitable {
    public velocity = 0.2; // m/sec
    public maxSteeringAngle = Math.PI / 180 * 70 // 70 degree
    public trailerLength = 14;
    public cabinLength = 6;
    private lastSteeringAngle: Angle = 0;
    private limited = true;

    public constructor(private tep: Point, private trailerAngle: Angle, private cabinAngle: Angle, private dock: Dock, private limits: Array<StraightLine> = []) {
        this.cabinAngle = this.fixAngle(cabinAngle)
        this.trailerAngle = this.fixAngle(trailerAngle)
    }

    public setLimits(limits: Array<StraightLine>): void {
        this.limits = limits;
    }

    public setLimited(limited: boolean): void {
        this.limited = limited;
    }

    public getStateVector(): nnMath.Vector {
        let cdp = this.getCouplingDevicePosition();
        return new nnMath.Vector([cdp.x, cdp.y, this.cabinAngle, this.tep.x, this.tep.y, this.trailerAngle])
    }

    private fixAngle(angle: Angle): Angle {
        angle = angle % (2 * Math.PI)
        if (angle > Math.PI) { // 180 deg + some deg => 
            angle = Math.PI - (angle - Math.PI);
        }
        if (angle < - Math.PI) {
            angle = Math.PI - (angle + Math.PI)
        }
        return angle;
    }

    /**
     * Relative to x-Axis
     */
    public getMaxTrailerAngle(): Angle {
        return Math.PI;
    }

    /**
     * Relative to trailer
     */
    public getMaxCabinAngle(): Angle {
        return 0.5 * Math.PI
    }
    public getTruckLength(): number {
        return this.cabinLength
    }

    public getLastSteeringAngle() {
        return this.lastSteeringAngle;
    }

    public setTruckPosition(tep: Point, trailerAngle: Angle, cabinAngle: Angle) {
        this.tep = tep;
        this.trailerAngle = this.fixAngle(trailerAngle)
        this.cabinAngle = this.fixAngle(cabinAngle)
    }
    
    public getTrailerLength(): number {
        return this.trailerLength
    }
    public getTrailerAngle() {
        return this.trailerAngle
    }
    public getTruckAngle() {
        return this.cabinAngle
    }

    public getTruckCorners() {
        let cabinDirection = rotate(new Vector(1, 0), this.cabinAngle);
        let orthogonal = cabinDirection.getOrthogonalVector();
        let scaled = orthogonal.scale(this.getWidth() / 2);

        let cdp = this.getCouplingDevicePosition();
        let cep = this.getEndOfTruck()
        let first = plus(cep, scaled);
        let second = minus(cep, scaled);

        let cfp = this.getCabinFrontPosition();
        let third = minus(cfp, scaled)
        let fourth = plus(cfp, scaled)

        return [first, second, third, fourth]
    }

    public getTrailerCorners() {
        let trailerDirection = rotate(new Vector(1,0), this.trailerAngle)
        let orthogonal = trailerDirection.getOrthogonalVector();
        let scaled = orthogonal.scale(this.getWidth() / 2);
        let first = plus(this.tep, scaled)
        let second = minus(this.tep, scaled);

        let cdp = this.getCouplingDevicePosition()
        let third = minus(cdp, scaled);
        let fourth = plus(cdp, scaled);
        return [first, second, third, fourth]
    }

    public getWidth(): number {
        return 0.5 * this.cabinLength;
    }

    public getTrailerEndPosition(): Point {
        return this.tep;
    }

    public getCouplingDevicePosition(): Point {
        let truckDirection = rotate(new Vector(1,0), this.trailerAngle).scale(this.trailerLength);
        let cdp = plus(this.tep, truckDirection)
        return cdp;
    }

    public getCabinFrontPosition(): Point {
       let cdp = this.getCouplingDevicePosition();
       let cabinDirection = rotate(new Vector(1, 0), this.cabinAngle).scale(this.cabinLength);
       return plus(cdp, cabinDirection);
    }

    public getEndOfTruck(): Point {
       let cabinDirection = rotate(new Vector(1, 0), this.cabinAngle);
       return plus(this.getCouplingDevicePosition(), cabinDirection.scale(2 / cabinDirection.getLength()));
    }

    public getCabTrailerAngle(): Angle {
        return Math.abs(this.trailerAngle - this.cabinAngle);
    }

    public nextTimeStep(steeringSignal: number) {
        this.drive(steeringSignal);
    }

    public nextState(steeringSignal: number): boolean {
        if (!this.limited || this.isTruckInValidPosition()) {
            //this.truck.nextTimeStep(steeringSignal);        
            this.drive(steeringSignal);
            return this.isTruckInValidPosition();
        } else {
            return false;
        }
    }

    // -1, 1
    public drive(steeringSignal: number): boolean {
        let steeringAngle = this.maxSteeringAngle * Math.min(Math.max(-1, steeringSignal), 1);
        this.lastSteeringAngle = steeringAngle
        let A = this.velocity * Math.cos(steeringAngle);
        let B = A * Math.cos(this.cabinAngle - this.trailerAngle)

        this.tep.x -= B * Math.cos(this.trailerAngle);
        this.tep.y -= B * Math.sin(this.trailerAngle);
        this.trailerAngle -= Math.asin(A * Math.sin(this.cabinAngle - this.trailerAngle) / this.trailerLength)
        this.cabinAngle += Math.asin(this.velocity * Math.sin(steeringAngle) / (this.trailerLength + this.cabinLength))

        // adjust cabinangle, s. t. getCabTrailerAngle <= 90 degrees (Math.PI / 2)
        let diff = this.trailerAngle - this.cabinAngle;
        if (diff < - Math.PI / 2) {
            this.cabinAngle = this.trailerAngle + Math.PI / 2
            this.lastSteeringAngle = 0
        } else if (diff > Math.PI / 2) { // this means, that trailerAngle is too big compared to cabinAngle =>
            this.cabinAngle = this.trailerAngle - Math.PI / 2;
            this.lastSteeringAngle = 0
        }

        return this.isTruckInValidPosition();
    }
       // TODO: add check that truck is not too far away from area
       private isTruckNotAtDock() {
        let truckCorners = this.getTruckCorners();
        let trailerCorners = this.getTrailerCorners();
        let a = this.dock.position;
        let b = plus(a, this.dock.dockDirection);

        let truckLeftOf = truckCorners.some((p) => isLeftOf(a, b, p));
        let trailerLeftOf = trailerCorners.some((p) => isLeftOf(a, b, p));
        return !(truckLeftOf || trailerLeftOf);
    }

    public randomizePosition(lesson: Lesson): void {
        let bounds = lesson.getBounds().entries;
        let tep1 = new Point(bounds[0], bounds[1]);
        let tep2 = new Point(bounds[2], bounds[3]);
        let maxAngleTrailer = [bounds[4], bounds[5]];
        let maxAngleCabin = [bounds[6], bounds[7]];
        this.randomizeTruckPosition(tep1, tep2, maxAngleTrailer, maxAngleCabin);
    }
    /**
     * 
     * @param tep1 left bottom corner
     * @param tep2 top right corner
     * @param maxAngleTrailer 
     * @param maxAngleCabin relative to trailer
     */
    public randomizeTruckPosition(tep1: Point, tep2: Point, maxAngleTrailer: Angle[], maxAngleCabin: Angle[]) {
        let tep = this.getRandomTEP(tep1, tep2);
        let trailerAngle = this.getRandomTrailerAngle(maxAngleTrailer);
        let cabinAngle = this.getRandomCabinAngle(maxAngleCabin, trailerAngle)
        this.setTruckPosition(tep, trailerAngle, cabinAngle);
        while(!this.isTruckInValidPosition()) {
            this.setTruckPosition(tep, trailerAngle, cabinAngle);
        }        
    }

    private getRandomTrailerAngle(maxAngleTrailer: Angle[]): Angle {
        let trailerAngle = Math.random() * (maxAngleTrailer[1] - maxAngleTrailer[0]) + maxAngleTrailer[0];
        return trailerAngle;        
    }

    private getRandomCabinAngle(maxAngleCabin: Angle[], trailerAngle: Angle): Angle {
        let cabinAngle = trailerAngle + Math.random() * (maxAngleCabin[1] - maxAngleCabin[0]) + maxAngleCabin[0];
        return cabinAngle;        
    }

    private getRandomTEP(tep1: Point, tep2: Point): Point {
        let x = Math.random() * (tep2.x - tep1.x) + tep1.x; 
        let y = Math.random() * (tep2.y - tep1.y) + tep1.y;
        let tep = new Point(x, y);
        return tep;
    }

    public randomizeNoLimits() {
        let tep1 = new Point(0,-50);
        let tep2 = new Point(100, 50);
        let tep = this.getRandomTEP(tep1, tep2);
        let maxCabinAngle = [- this.getMaxCabinAngle(), this.getMaxCabinAngle()];
        let maxTrailerAngle =  [- this.getMaxTrailerAngle() , this.getMaxTrailerAngle()];
        let trailerAngle = this.getRandomTrailerAngle(maxCabinAngle);
        let cabinAngle = this.getRandomCabinAngle(maxCabinAngle, trailerAngle);
        this.setTruckPosition(tep, trailerAngle, cabinAngle);
    }


    private isTruckInArea() {
        let truckCorners = this.getTruckCorners();
        let trailerCorners = this.getTrailerCorners();

        let match = false;
        for (let i = 0; i < this.limits.length; i++) {
            let limit = truckCorners.some((p) => this.limits[i].isLeftOf(p) || trailerCorners.some((p) => this.limits[i].isLeftOf(p)));
            match = match || limit;
        }        
        return !match
    }

    public isTruckInValidPosition(): boolean {
        return !this.limited || (this.isTruckNotAtDock() && this.isTruckInArea());
    }
}

export class TruckException extends Error {
    public constructor(message: string) {
        super(message);
    }
}