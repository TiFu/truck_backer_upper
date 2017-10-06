import { Point, Vector, isLeftOf, plus, StraightLine, Angle, rotate } from '../math'
import { Truck } from './truck'

export class Dock {
    public dockDirection: Vector;

    constructor(public position: Point) {
        this.dockDirection = new Vector(0, 1);
    }

}

export class World {
    public dock: Dock;
    public truck: Truck;
    private limits: Array<StraightLine> = [];

    constructor() {      
        this.resetWorld(); // TODO: make rectangle for area instead of straight lines (but use lines to check for violation)
        this.limits = [
            new StraightLine(new Point(0,0), new Vector(0, 1)), // left
            new StraightLine(new Point(0,25), new Vector(1, 0)), // top
            new StraightLine(new Point(70,25), new Vector(0, -1)), // left
            new StraightLine(new Point(70,-25), new Vector(-1, 0)), // left
        ]
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
        return this.isTruckNotAtDock() && this.isTruckInArea();
    }
    public resetWorld() {
        this.dock = new Dock(new Point(0, 0));         
        this.truck = new Truck(new Point(55,0), 0, 0);
    }

    public randomizeMax() {
        let tep = new Point(7,18)
        let tep2 = new Point(63, -18)
        this.truck.setTruckIntoRandomPosition([tep, tep2], [-Math.PI, Math.PI] );
        while(!this.isTruckInValidPosition()) {
            this.truck.setTruckIntoRandomPosition([tep, tep2], [-Math.PI, Math.PI] );
        }
        console.log("[World][RandMax]: ", this.truck.getStateVector().toString());
    }

    public randomize() {
        let tep = new Point(12,13)
        let tep2 = new Point(58, -13)
        this.truck.setTruckIntoRandomPosition([tep, tep2], [-Math.PI, Math.PI] );
        while(!this.isTruckInValidPosition()) {// TODO: better max implementation
            this.truck.setTruckIntoRandomPosition([tep, tep2], [-Math.PI, Math.PI] );
        }
    }

    public nextTimeStep(steeringSignal: number): boolean {
        if (this.isTruckInValidPosition()) {
            this.truck.nextTimeStep(steeringSignal);        
            return this.isTruckInValidPosition();
        } else {
            return false;
        }
    }
}