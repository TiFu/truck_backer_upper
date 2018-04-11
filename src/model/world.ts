import { Point, Vector, isLeftOf, plus, StraightLine, Angle, rotate } from '../math'
import { Truck } from './truck'
import {Car} from './car'
import * as nnMath from '../neuralnet/math';
import {Lesson} from '../neuralnet/lesson'
export class Dock {
    public dockDirection: Vector;

    constructor(public position: Point) {
        this.dockDirection = new Vector(0, 1);
    }

}
export interface HasState {
    getStateVector(): nnMath.Vector
    nextState(input: number): boolean;
    randomizePosition(lesson: Lesson): void;
}

export interface Limitable {
    setLimits(limits: Array<StraightLine>): void;
    setLimited(limited: boolean): void;
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
    private limits = [
        new StraightLine(new Point(0,0), new Vector(0, 1)), // left
        new StraightLine(new Point(0,100), new Vector(1, 0)), // top
        new StraightLine(new Point(200,100), new Vector(0, -1)), // left
        new StraightLine(new Point(200,-100), new Vector(-1, 0)), // left
    ];

    constructor() {      
        this.resetWorld();
    }

    public setWorldLimited(limited: boolean) {
        this.truck.setLimited(limited);
    }

    public getLimits(): Array<StraightLine> {
        return this.limits;
    }

    public resetWorld() {
        this.dock = new Dock(new Point(0, 0));         
        this.truck = new Truck(new Point(55,0), 0, 0, this.dock, []);
        this.truck.setLimits(this.limits);
        this.car = new Car(new Point(15,15), 0);
    }

    public nextTimeStep(steeringSignal: number): boolean {
        return this.truck.nextState(steeringSignal);
    }
}