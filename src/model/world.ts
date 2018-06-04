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

export interface HasLength {
    getLength(): number;
}

export interface HasState {
    getOriginalState(): nnMath.Vector; // unnormalized
    getStateVector(): nnMath.Vector // normalized
    getStateDescription(): string[];
    nextState(input: number, time: number): boolean;
    getMaxSteeringAngle(): number;
    randomizePosition(lesson: Lesson): void;
    randomizePosition(): void;
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
    private limits = [
        new StraightLine(new Point(0,0), new Vector(0, 1)), // left
        new StraightLine(new Point(0,100), new Vector(1, 0)), // top
        new StraightLine(new Point(200,100), new Vector(0, -1)), // left
        new StraightLine(new Point(200,-100), new Vector(-1, 0)), // left
    ];

    constructor(public movableObject: HasState & Limitable, public dock: Dock) {      
    }


    public setWorldLimited(limited: boolean) {
        this.movableObject.setLimited(limited);
    }

    public getLimits(): Array<StraightLine> {
        return this.limits;
    }

    public nextTimeStep(steeringSignal: number, time: number = 1): boolean {
        return this.movableObject.nextState(steeringSignal, time);
    }
}