import { Point, scale, minus, plus,  Vector, Angle, getAngle, calculateVector, rotate, StraightLine } from '../math'
import * as nnMath from '../neuralnet/math' // TODO: union math libraries..
import {AngleType, HasState, Limitable, HasLength} from './world'
import {Lesson} from '../neuralnet/lesson'

export class NormalizedCar implements HasState, Limitable, HasLength {
    public constructor(private car: Car) {

    }

    public getLength() {
        return this.car.getLength();
    }
    public setLimits(limits: StraightLine[]) {
//        this.car.setLimits(limits);
    }

    public getStateDescription() {
        return this.car.getStateDescription();
    }

    public setLimited(limited: boolean) {
        //this.car.setLimited(limited);
    }
    public randomizePosition(lesson: Lesson) {
        this.car.randomizePosition(lesson);
    }

    public nextState(steeringSignal: number): boolean {
        return this.car.nextState(steeringSignal);
    }

    public getOriginalState(): nnMath.Vector {
        return this.car.getOriginalState();
    }

    public getStateVector(): nnMath.Vector {
        let stateVector = this.car.getStateVector();
        stateVector.entries[0] = (stateVector.entries[0] - 50) / 50; // [0,70] -> [-1, 1]
        stateVector.entries[1] = stateVector.entries[1] / 50; // [-25, 25] -> [-1, 1]
        stateVector.entries[2] /= Math.PI; // [-Math.PI, Math.PI] -> [-1, 1]
        return stateVector;
    }
}
export class Car implements HasState, HasLength {
    private maxAngle: Angle = 70 / 180 * Math.PI;
    private velocity: number = -3;
    private carLength: number = 5;
    private lastSteeringAngle = 0;

    public constructor(private axle: Point, private angle: Angle) {
    }

    public getLength() {
        return this.carLength;
    }
    public getStateDescription() {
        return ["x", "y", "angle"];
    }
    public getOriginalState(): nnMath.Vector {
        return this.getStateVector();
    }
    public getStateVector(): nnMath.Vector {
        return new nnMath.Vector([this.axle.x, this.axle.y, this.angle]);
    }

    public getFront(): Point {
        let direction = rotate(new Vector(1,0), this.angle)
        return plus(this.axle, direction.scale(this.carLength / direction.getLength()));
    }

    public getBack(): Point {
        return this.axle;
    }

    public getWidth(): number {
        return this.carLength / 2
    }

    public getLastSteeringAngle() {
        return this.lastSteeringAngle;
    }
    public getCorners(): Point[] {
        let frontDirection = rotate(new Vector(1,0), this.angle);
        let orthogonal = frontDirection.getOrthogonalVector();
        let dir = orthogonal.scale(this.getWidth() / 2 / orthogonal.getLength());
        let back = this.getBack();
        let front = this.getFront();

        let first = plus(back, dir);
        let second = plus(front, dir);
        let third = minus(front, dir);
        let fourth = minus(back, dir);
        return [first, second, third, fourth];
    }

    public nextState(steeringSignal: number) {
        this.nextTimeStep(steeringSignal);
        return this.canContinue();
    }

    public canContinue(): boolean {
        let back = this.axle;
        let frontDirection = rotate(new Vector(1, 0), this.angle);
        let scaledFrontDirection = frontDirection.scale(this.getLength() / frontDirection.getLength());
        let front = this.axle.addVector(scaledFrontDirection);
        return back.x > 0 && front.x > 0 && back.x < 100 && Math.abs(back.y) < 50 && front.x < 100 && Math.abs(front.y) < 50 ;
    }
    
    public nextTimeStep(steeringSignal: number) {
        let steeringAngle = steeringSignal * this.maxAngle;
        this.lastSteeringAngle = steeringAngle

        let dAngle = steeringAngle;
        let dX = this.velocity * Math.cos(this.angle + steeringAngle)
        let dY = this.velocity * Math.sin(this.angle + steeringAngle)

        this.axle.x += dX;
        this.axle.y += dY;
        this.angle += dAngle;
    }

    public randomizePosition(lesson: Lesson): void {
        let bounds = lesson.getBounds().entries;
        let tep1 = new Point(bounds[0], bounds[1]);
        let tep2 = new Point(bounds[2], bounds[3]);
        let maxAngleTrailer = [bounds[4], bounds[5]];
        let maxAngleCabin = [bounds[6], bounds[7]];
        this.randomizeTruckPosition(tep1, tep2, maxAngleTrailer, maxAngleCabin);
    }

    // TODO: less duplicated code
    private getRandomTEP(tep1: Point, tep2: Point): Point {
        let x = Math.random() * (tep2.x - tep1.x) + tep1.x; 
        let y = Math.random() * (tep2.y - tep1.y) + tep1.y;
        let tep = new Point(x, y);
        return tep;
    }
    private getRandomTrailerAngle(maxAngleTrailer: Angle[]): Angle {
        let trailerAngle = Math.random() * (maxAngleTrailer[1] - maxAngleTrailer[0]) + maxAngleTrailer[0];
        return trailerAngle;        
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
        this.axle.x = tep.x;
        this.axle.y = tep.y;
        this.angle = trailerAngle;
    }

    public getJacobiMatrix(input: nnMath.Vector): nnMath.Matrix {
        let jacobiMatrix = new nnMath.Matrix([
            [1, 0, - this.velocity * Math.sin(input.entries[2] + input.entries[3]), - this.velocity * Math.sin(input.entries[2] + input.entries[3])], // x
            [0, 1, this.velocity * Math.cos(input.entries[2] + input.entries[3]), this.velocity * Math.cos(input.entries[2] + input.entries[3])], // y 
            [0, 0, 1, 1] // angle
        ]);
        return jacobiMatrix;
    }
}

import {Emulator} from '../neuralnet/emulator'
export class CarEmulator implements Emulator {
    private input: nnMath.Vector[];

    public constructor(private car: Car) {

    }

    public setNotTrainable(trainable: boolean): void {

    }
    public forward(input: nnMath.Vector): void {
        if (!this.input) {
            this.input = [];
        }

        this.input.push(input);
    }

    public backward(gradient: nnMath.Vector){ 
        let lastInput = this.input.pop();
        let matrix = this.car.getJacobiMatrix(lastInput);
        return gradient.multiplyMatrixFromLeft(matrix);
    }
}