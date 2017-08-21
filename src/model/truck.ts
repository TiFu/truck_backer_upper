import { Point, scale, minus, plus,  Vector, Angle, getAngle, calculateVector, rotateVector } from '../math'
import {expect} from 'chai';

export class Truck {
    public velocity = 1; // m/sec
    public maxSteeringAngle = Math.PI / 180 * 70 // 45 degree

    public trailerLength: number;
    public truckLength: number;
    public trailerXAngle: Angle;
    public truckXAngle: Angle;

    private lastSteeringAngle: Angle;
    public constructor(public cabinFrontPosition: Point, public couplingDevicePosition: Point, public trailerEndPosition: Point) {
        this.calculateAngles();
        this.calculateLengths();
    }
    public getEndOfTruck(): Point {
        let vec = calculateVector(this.cabinFrontPosition, this.couplingDevicePosition).scale(7/12.);
        return this.cabinFrontPosition.addVector(vec);
    }

    public getTruckCorners(): Point[] {
        return this.calculateCornersFrom2Points(this.getEndOfTruck(), this.cabinFrontPosition);
    }

    private calculateCornersFrom2Points(a: Point, b: Point): Point[] {
        let directionVector = calculateVector(a, b);
        let ortho = directionVector.getOrthogonalVector();
        let perpendicular = scale(ortho, 0.5 * this.getWidth() / ortho.getLength());

        let leftTop = plus(a, perpendicular);
        let rightTop = minus(a, perpendicular);
        let rightBottom = minus(b, perpendicular);
        let leftBottom = plus(b, perpendicular);       
        return [leftTop, rightTop, rightBottom, leftBottom];
    }

    public getTrailerCorners(): Point[] {
        return this.calculateCornersFrom2Points(this.trailerEndPosition, this.couplingDevicePosition);
    }

    public getWidth(): number {
        return calculateVector(this.getEndOfTruck(), this.cabinFrontPosition).getLength();
    }

    private calculateAngles() {
        let cabinVector = calculateVector(this.couplingDevicePosition, this.cabinFrontPosition);
        let xVector = new Vector(1, 0);
        this.truckXAngle = getAngle(cabinVector, xVector);

        let trailerVector = calculateVector(this.trailerEndPosition, this.couplingDevicePosition);
        this.trailerXAngle = getAngle(trailerVector, xVector);
    }


    public toString(): string {
        let str = "";
       // str += "Cabin: " + this.cabinFrontPosition.toString() + "\n"
        str += this.cabinFrontPosition.x + "," + this.cabinFrontPosition.y + "," + this.couplingDevicePosition.x + "," + this.couplingDevicePosition.y;
        str += "," + this.trailerEndPosition.x + "," + this.trailerEndPosition.y;
//              str += "Trailer End Position: " + this.trailerEndPosition.toString() + "\n"
        return str;
    }

    public getSteeringAngle(): number {
        return this.lastSteeringAngle === undefined ? 0 : this.lastSteeringAngle;
    }

    public isJacknifed() {
        return Math.abs(this.trailerXAngle - this.truckXAngle) > 90 * Math.PI / 180;
    }

    private calculateLengths() {
        this.trailerLength = calculateVector(this.couplingDevicePosition, this.trailerEndPosition).getLength();        
        this.truckLength = calculateVector(this.cabinFrontPosition, this.couplingDevicePosition).getLength();
    }

    private getTrailerAngle(): Angle {
        return this.truckXAngle - this.trailerXAngle;
    }

    public nextTimeStep(steeringSignal: number) {
        let steeringAngle = steeringSignal * this.maxSteeringAngle;
        console.log("Last Angle: " + steeringAngle);
        this.lastSteeringAngle = steeringAngle;

        let a = this.velocity * Math.cos(steeringAngle)
        let b = a * Math.cos(this.truckXAngle - this.trailerXAngle)
        this.trailerEndPosition.x -= b * Math.cos(this.trailerXAngle)
        this.trailerEndPosition.y -= b * Math.sin(this.trailerXAngle)
        
        this.trailerXAngle -= Math.asin((a * Math.sin(this.truckXAngle - this.trailerXAngle))/this.trailerLength)
        this.truckXAngle += Math.asin((this.velocity * Math.sin(steeringAngle))/(this.truckLength + this.trailerLength))
        let newTrailerAngle = this.getTrailerAngle();
        if (newTrailerAngle > Math.PI / 2) {
            this.truckXAngle -= newTrailerAngle - Math.PI / 2;
            this.lastSteeringAngle = 0;
        } else if (newTrailerAngle < - Math.PI / 2) {
            this.truckXAngle -= newTrailerAngle + Math.PI / 2;
            this.lastSteeringAngle = 0;
        }
        console.log("New Truck Angle: " + this.truckXAngle);
        console.log("New Trailer Angle: " + this.trailerXAngle);
        console.log("Diff: " + this.getTrailerAngle());
        this.couplingDevicePosition.x = this.trailerEndPosition.x + Math.cos(this.trailerXAngle) * this.trailerLength
        this.couplingDevicePosition.y = this.trailerEndPosition.y + Math.sin(this.trailerXAngle) * this.trailerLength
        this.cabinFrontPosition.x = this.couplingDevicePosition.x + Math.cos(this.truckXAngle) * this.truckLength
        this.cabinFrontPosition.y = this.couplingDevicePosition.y + Math.sin(this.truckXAngle) * this.truckLength
    }
}

export class TruckException extends Error {
    public constructor(message: string) {
        super(message);
    }
}