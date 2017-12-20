import { Point, scale, minus, plus,  Vector, Angle, getAngle, calculateVector, rotate } from '../math'
import * as nnMath from '../neuralnet/math' // TODO: union math libraries..
import {AngleType} from './world'

export class Car {
    private maxAngle: Angle = 70 / 180 * Math.PI;
    private velocity: number = -3;
    private carLength: number = 5;
    private lastSteeringAngle = 0;

    public constructor(private axle: Point, private angle: Angle) {
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
    public nextTimeStep(steeringSignal: number) {
        let steeringAngle = steeringSignal * this.maxAngle;
        this.lastSteeringAngle = steeringAngle

        let dX = this.velocity * Math.cos(this.angle)
        let dY = this.velocity * Math.sin(this.angle)
        let dAngle = this.velocity / this.carLength * Math.tan(steeringAngle)

        this.axle.x += dX;
        this.axle.y += dY;
        this.angle += dAngle;
    }
}