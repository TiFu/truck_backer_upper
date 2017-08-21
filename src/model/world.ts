import { Point, Vector, isLeftOf, plus } from '../math'
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

    constructor() {      
        this.dock = new Dock(new Point(0, 0));         
        this.truck = new Truck(new Point(25,0), new Point(19, 0), new Point(5, 0));
        // TODO: assert that truck is right of dock
    }

    public isEndState() {
        return this.truck.isJacknifed() || this.isTruckAtDock();
    }

    private isTruckAtDock() {
        let truckCorners = this.truck.getTruckCorners();
        let trailerCorners = this.truck.getTrailerCorners();
        let a = this.dock.position;
        let b = plus(a, this.dock.dockDirection);

        let truckLeftOf = truckCorners.some((p) => isLeftOf(a, b, p));
        let trailerLeftOf = trailerCorners.some((p) => isLeftOf(a, b, p));
        return truckLeftOf || trailerLeftOf;
    }


    public nextTimeStep(steeringSignal: number): boolean {
        if (!this.isTruckAtDock()) {
            this.truck.nextTimeStep(steeringSignal);        
            return this.isTruckAtDock();
        } else {
            return false;
        }
    }
}