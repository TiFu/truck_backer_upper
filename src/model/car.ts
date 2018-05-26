import { Point, scale, minus, plus,  Vector, Angle, getAngle, calculateVector, rotate } from '../math'
import * as nnMath from '../neuralnet/math' // TODO: union math libraries..
import {AngleType, HasState} from './world'

export class Car implements HasState {
    private maxAngle: Angle = 70 / 180 * Math.PI;
    private velocity: number = -3;
    private carLength: number = 5;
    private lastSteeringAngle = 0;

    public randomizePosition() {
        console.log("[Car] Do nothing in randomize!");
    }

    public constructor(private axle: Point, private angle: Angle) {
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
        return true;
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

    public getJacobiMatrix(input: nnMath.Vector): nnMath.Matrix {
        let jacobiMatrix = new nnMath.Matrix([
            [1, 0, - this.velocity * Math.sin(input.entries[2] + input.entries[3]), - this.velocity * Math.sin(input.entries[2] + input.entries[3])], // x
            [0, 1, this.velocity * Math.cos(input.entries[2] + input.entries[3]), this.velocity * Math.cos(input.entries[2] + input.entries[3])], // y 
            [0, 0, 1, 1] // angle
        ])
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