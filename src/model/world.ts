import { Point, Vector } from '../math'
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
        this.truck = new Truck(new Point(20,20), new Point(20, 14), new Point(20, 0));
        // TODO: assert that truck is right of dock
    }

    public isEndState() {
        return this.truck.isJacknifed() || this.isTruckAtDock();
    }

    private isTruckAtDock() {
        return this.truck.trailerEndPosition.x < this.dock.position.x;
    }


    public nextTimeStep(steeringSignal: number) {
        this.truck.nextTimeStep(steeringSignal);        
    }
}