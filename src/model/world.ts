import { Point, Vector, isLeftOf, plus, StraightLine, Angle, rotate } from '../math'
import { Truck } from './truck'
import {Car} from './car'

export class Dock {
    public dockDirection: Vector;

    constructor(public position: Point) {
        this.dockDirection = new Vector(0, 1);
    }

}

export enum AngleType {
    CAB,
    TRAILER,
    BOTH
}

export class World {
    public dock: Dock;
    public truck: Truck;
    public car: Car;
    private limits: Array<StraightLine> = [];
    private limited = true;

    constructor() {      
        this.resetWorld(); // TODO: make rectangle for area instead of straight lines (but use lines to check for violation)
        this.limits = [
            new StraightLine(new Point(0,0), new Vector(0, 1)), // left
            new StraightLine(new Point(0,100), new Vector(1, 0)), // top
            new StraightLine(new Point(200,100), new Vector(0, -1)), // left
            new StraightLine(new Point(200,-100), new Vector(-1, 0)), // left
        ]
    }

    public setWorldLimited(limited: boolean) {
        this.limited = limited;
    }

    public getLimits(): Array<StraightLine> {
        return this.limits;
    }

    // TODO: add check that truck is not too far away from area
    private isTruckNotAtDock() {
        let truckCorners = this.truck.getTruckCorners();
        let trailerCorners = this.truck.getTrailerCorners();
        let a = this.dock.position;
        let b = plus(a, this.dock.dockDirection);

        let truckLeftOf = truckCorners.some((p) => isLeftOf(a, b, p));
        let trailerLeftOf = trailerCorners.some((p) => isLeftOf(a, b, p));
        return !(truckLeftOf || trailerLeftOf);
    }

    private isTruckInArea() {
        let truckCorners = this.truck.getTruckCorners();
        let trailerCorners = this.truck.getTrailerCorners();

        let match = false;
        for (let i = 0; i < this.limits.length; i++) {
            let limit = truckCorners.some((p) => this.limits[i].isLeftOf(p) || trailerCorners.some((p) => this.limits[i].isLeftOf(p)));
            match = match || limit;
        }        
        return !match
    }

    private isTruckInValidPosition(): boolean {
        return !this.limited || (this.isTruckNotAtDock() && this.isTruckInArea());
    }
    public resetWorld() {
        this.dock = new Dock(new Point(0, 0));         
        this.truck = new Truck(new Point(55,0), 0, 0);
        this.car = new Car(new Point(15,15), 0);
    }

    private radToDeg(arr: Array<Angle>) {
        return [arr[0] * 180 / Math.PI, arr[1] * 180 / Math.PI];
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
        this.truck.setTruckPosition(tep, trailerAngle, cabinAngle);
        while(!this.isTruckInValidPosition()) {
            this.truck.setTruckPosition(tep, trailerAngle, cabinAngle);
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
/*    public randomizeMax(tep1: Point, tep2: Point, maxTrailerAngle: Array<Angle>, maxCabinAngle: Array<Angle>) {
        if (tep1 == undefined) {
            tep1 = new Point(7,18)
        }
        if (tep2 == undefined) {
            tep2 = new Point(63, -18)            
        }

        tep1.x = Math.min(Math.max(7, tep1.x), 63);
        tep1.y = Math.max(Math.min(18, tep1.y), -18);        

        tep2.x = Math.min(Math.max(tep2.x, tep1.x), 63);
        tep2.y = Math.max(Math.min(tep2.y, tep1.y), -18);

//        console.log("Random Position in " + tep1 + " and " + tep2 + " with angles " + this.radToDeg(maxTrailerAngle) + " / " + this.radToDeg(maxCabinAngle))
        this.truck.setTruckIntoRandomPosition([tep1, tep2], maxTrailerAngle, maxCabinAngle );
        while(!this.isTruckInValidPosition()) {
            this.truck.setTruckIntoRandomPosition([tep1, tep2], maxTrailerAngle, maxCabinAngle);
        }
    }*/
    private getRandomTEP(tep1: Point, tep2: Point): Point {
        let x = Math.random() * (tep2.x - tep1.x) + tep1.x; 
        let y = Math.random() * (tep2.y - tep1.y) + tep1.y;
        let tep = new Point(x, y);
        return tep;
    }
    public randomizeNoLimits() {
        let tep1 = new Point(0,-100);
        let tep2 = new Point(200, 100);
        let tep = this.getRandomTEP(tep1, tep2);
        let maxCabinAngle = [- this.truck.getMaxCabinAngle(), this.truck.getMaxCabinAngle()];
        let maxTrailerAngle =  [- this.truck.getMaxTrailerAngle() , this.truck.getMaxTrailerAngle()];
        let trailerAngle = this.getRandomTrailerAngle(maxCabinAngle);
        let cabinAngle = this.getRandomCabinAngle(maxCabinAngle, trailerAngle);
        this.truck.setTruckPosition(tep, trailerAngle, cabinAngle);
    }

/*    public randomize() {
        let tep = new Point(12,13)
        let tep2 = new Point(58, -13)
        this.truck.setTruckPosition([tep, tep2], [-Math.PI, Math.PI], [-0.5 * Math.PI, 0.5 * Math.PI]);
        while(!this.isTruckInValidPosition()) {// TODO: better max implementation
            this.truck.setTruckIntoRandomPosition([tep, tep2], [-Math.PI, Math.PI], [-0.5 * Math.PI, 0.5 * Math.PI] );
        }
    }*/

    public nextTimeStep(steeringSignal: number): boolean {
        if (!this.limited || this.isTruckInValidPosition()) {
            this.truck.nextTimeStep(steeringSignal);        
            this.car.nextTimeStep(steeringSignal);
            return this.isTruckInValidPosition();
        } else {
            return false;
        }
    }
}