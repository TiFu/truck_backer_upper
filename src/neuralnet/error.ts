import {Vector, Scalar, plus} from './math';
import {Point} from '../math'
import {Dock} from '../model/world';
import { getCiphers } from 'crypto';

export interface ErrorFunction {
    getError(is: Vector, should: Vector): Scalar;
    getErrorDerivative(is: Vector, sholud:Vector): Vector;
}

export class MSE implements ErrorFunction {
        
    public getError(is: Vector, should: Vector): Scalar {
        let diff = 0;
        for (let i = 0; i < is.length; i++) {
            let d =  is.entries[i] - should.entries[i];
            diff += d * d;
        }
        return diff / is.length;
    }

    public getErrorDerivative(is: Vector, should: Vector): Vector {
        return plus(is, should.getScaled(-1)).scale(2 / is.length);
    }
}

export class WeightedMSE implements ErrorFunction {
    private weightSum: number;

    public constructor(private weights: Vector) {
        this.weightSum = weights.entries.reduce((prev, next) => prev + next, 0);
    }
            
    public getError(is: Vector, should: Vector): Scalar {
        let diff = 0;
        for (let i = 0; i < is.length; i++) {
            let d =  is.entries[i] - should.entries[i];
            diff += this.weights.entries[i] * d * d;
        }
        return diff / this.weightSum;
    }

    public getErrorDerivative(is: Vector, should: Vector): Vector {
        return plus(is, should.getScaled(-1)).multiplyElementWise(this.weights).scale(2 / this.weightSum);
    }
}

export interface ControllerError {
    getError(finalState: Vector): Scalar;
    getErrorDerivative(finalState: Vector): Vector;
}

export class SimpleControllerError implements ControllerError {
    public getError(finalState: Vector): Scalar {
        return finalState.entries[0] * finalState.entries[0];
    }

    public getErrorDerivative(finalState: Vector): Vector {
        return new Vector([2 * finalState.entries[0]]);
    }
}

export class TruckControllerError implements ControllerError {
    private angleError: Array<number>;
    private yError: Array<number>;

    public constructor(private dock: Point) {
        this.angleError = [];
        this.yError = [];
    }
    
    public getErrorDerivative(finalState: Vector): Vector {
        let xTrailer = finalState.entries[3];
        let yTrailer = finalState.entries[4];
        let thetaTrailer = finalState.entries[5];

        // Derivative of SSE
        let xDiff = Math.max(xTrailer,-1) - this.dock.x; 
        let yDiff = yTrailer - this.dock.y;
        let thetaDiff = thetaTrailer - 0;
        
        // first 3 do not matter for the error
        return new Vector([0, 0, 0, 2 * xDiff, 2 * yDiff, 2 * thetaDiff]);
    }

    // 3 elements: x trailer y trailer theta trailer at position 3 4 and 5
    public getError(finalState: Vector) {
        let xTrailer = finalState.entries[3];
        let yTrailer = finalState.entries[4];
        let thetaTrailer = finalState.entries[5];
        // IMPORTANT: x = 0 is at -1 because of the x transformation!
        // we just ignore x < 0 This also explains why it tries to drive a circle with max(xTrailer, 0)
        let xDiff = Math.max(xTrailer, -1) - this.dock.x
        let yDiff = yTrailer - this.dock.y
        let thetaDiff = thetaTrailer - 0

        // We input the final state in emulator output space => angle / Math.PI and y divided by 25
        this.angleError.push(Math.abs(thetaDiff * Math.PI))
        this.yError.push(Math.abs(yDiff * 25))

        if (Math.abs(thetaTrailer) > Math.PI) {
            console.log("Needs angle correction!!!");
            console.log("Trailer Angle: ", thetaTrailer / Math.PI * 180);
        }
        return xDiff * xDiff + yDiff * yDiff + thetaDiff * thetaDiff;
    }
}
