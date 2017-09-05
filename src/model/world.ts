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
        this.resetWorld();
    }

    // TODO: add check that truck is not too far away from area
    private isTruckAtDock() {
        let truckCorners = this.truck.getTruckCorners();
        let trailerCorners = this.truck.getTrailerCorners();
        let a = this.dock.position;
        let b = plus(a, this.dock.dockDirection);

        let truckLeftOf = truckCorners.some((p) => isLeftOf(a, b, p));
        let trailerLeftOf = trailerCorners.some((p) => isLeftOf(a, b, p));
        return truckLeftOf || trailerLeftOf;
    }
// TODO: reset world state function

    public resetWorld() {
        this.dock = new Dock(new Point(0, 0));         
        this.truck = new Truck(new Point(50,0), new Point(44, 0), new Point(30, 0));
    }

    public randomize() {
        this.truck.setTruckIntoRandomPosition(new Point(0, 10), new Point(55, 0) );
        while(this.isTruckAtDock()) {
            this.truck.setTruckIntoRandomPosition(new Point(0, 10), new Point(55, 0) );
        }
    }

    public nextTimeStep(steeringSignal: number): boolean {
        if (!this.isTruckAtDock()) {
            this.truck.nextTimeStep(steeringSignal);        
            return !this.isTruckAtDock();
        } else {
            return false;
        }
    }
}