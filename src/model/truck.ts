import { Point, scale, minus, plus,  Vector, Angle, getAngle, calculateVector, rotate } from '../math'
import * as nnMath from '../neuralnet/math' // TODO: union math libraries..

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
        console.log(this.cabinFrontPosition.x);
        console.log(this.couplingDevicePosition.x)
        console.log("Initial Position: ", this.getStateVector().toString());
    }

    public getStateVector(): nnMath.Vector {
        return new nnMath.Vector([this.couplingDevicePosition.x, this.couplingDevicePosition.y, this.truckXAngle, this.trailerEndPosition.x, this.trailerEndPosition.y, this.trailerXAngle]);
    }

    public getEndOfTruck(): Point {
        let vec = calculateVector(this.cabinFrontPosition, this.couplingDevicePosition).scale(7/12.);
        return this.cabinFrontPosition.addVector(vec);
    }

    public getTruckCorners(): Point[] {
        return this.calculateCornersFrom2Points(this.getEndOfTruck(), this.cabinFrontPosition);
    }

    public setTruckIntoRandomPosition(topLeft: Point, bottomRight: Point) {
        let width = bottomRight.x - topLeft.x;
        let height = bottomRight.y - topLeft.y;

        let cdpX = topLeft.x + width * Math.random();
        let cdpY = topLeft.y + height * Math.random();
        let cdp = new Point(cdpX, cdpY);

        let trailerDirectionVector = new Vector(2 * Math.random() - 1, 2 * Math.random() - 1);
        trailerDirectionVector.scale(this.trailerLength / trailerDirectionVector.getLength());
        let tep = plus(cdp, trailerDirectionVector);

        // now points from tep to cdp
        trailerDirectionVector.scale(-1);
        trailerDirectionVector.scale(this.truckLength / trailerDirectionVector.getLength());
        let degree: Angle = (Math.random() * 2 -1 ) * Math.PI / 2; // rotation between -90 and 90 degrees
        let rotatedVector = rotate(trailerDirectionVector, degree);

        let cfp = plus(cdp, rotatedVector);

        this.couplingDevicePosition = cdp;
        this.cabinFrontPosition = cfp;
        this.trailerEndPosition = tep;
        console.log("New Position: ",  this.cabinFrontPosition.toString(), this.couplingDevicePosition.toString(), this.trailerEndPosition.toString());
        this.calculateAngles();
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
        let val = this.truckXAngle - this.trailerXAngle;
        return val;
    }

    public nextTimeStep(steeringSignal: number) {
        let steeringAngle = steeringSignal * this.maxSteeringAngle;
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

        if (this.trailerXAngle >= 2 * Math.PI) {
            this.truckXAngle -= 2 * Math.PI;
            this.trailerXAngle -= 2 * Math.PI;
        } else if (this.trailerXAngle < 0) {
            this.truckXAngle += 2 * Math.PI;
            this.trailerXAngle += 2 * Math.PI;
        }


        this.couplingDevicePosition.x = this.trailerEndPosition.x + Math.cos(this.trailerXAngle) * this.trailerLength
        this.couplingDevicePosition.y = this.trailerEndPosition.y + Math.sin(this.trailerXAngle) * this.trailerLength
        this.cabinFrontPosition.x = this.couplingDevicePosition.x + Math.cos(this.truckXAngle) * this.truckLength
        this.cabinFrontPosition.y = this.couplingDevicePosition.y + Math.sin(this.truckXAngle) * this.truckLength

        // normalize angles
    }
}

export class TruckException extends Error {
    public constructor(message: string) {
        super(message);
    }
}