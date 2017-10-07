import { Point, scale, minus, plus,  Vector, Angle, getAngle, calculateVector, rotate } from '../math'
import * as nnMath from '../neuralnet/math' // TODO: union math libraries..

import {expect} from 'chai';


export class Truck {
    public velocity = 1; // m/sec
    public maxSteeringAngle = Math.PI / 180 * 70 // 70 degree
    public trailerLength = 7;
    public cabinLength = 5;

    private lastSteeringAngle: Angle = 0;
    public constructor(private tep: Point, private trailerAngle: Angle, private cabinAngle: Angle) {

    }

    public getStateVector(): nnMath.Vector {
        let cdp = this.getCouplingDevicePosition();

        return new nnMath.Vector([cdp.x, cdp.y, this.fixAngle(this.cabinAngle), this.tep.x, this.tep.y, this.fixAngle(this.trailerAngle)])
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
    public getTruckLength(): number {
        return this.cabinLength
    }

    public getLastSteeringAngle() {
        return this.lastSteeringAngle;
    }
    /**
     * 
     * @param maxTep 
     * @param maxTrailerAngle 
     */
    public setTruckIntoRandomPosition(maxTep: Array<Point>, maxTrailerAngle: Array<Angle>, maxCabinAngle: Array<Angle>) {
        let tepAngle = Math.random() * (maxTrailerAngle[1] - maxTrailerAngle[0]) + maxTrailerAngle[0];
        this.trailerAngle = tepAngle
        this.tep.x = Math.random() * (maxTep[1].x - maxTep[0].x) + maxTep[0].x
        this.tep.y = Math.random() * (maxTep[1].y - maxTep[0].y) + maxTep[0].y

        let cabAng = Math.random() * (maxCabinAngle[1] - maxCabinAngle[0]) + maxCabinAngle[0]// Math.PI - 0.5 * Math.PI;
        let cabinAngle = tepAngle + cabAng;
        this.cabinAngle = cabinAngle;
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

    // -1, 1
    public drive(steeringSignal: number) {
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
    }
}

export class TruckException extends Error {
    public constructor(message: string) {
        super(message);
    }
}