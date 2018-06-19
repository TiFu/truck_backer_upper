import {Vector, Scalar, plus} from './math';
import {Point} from '../math'
import {Dock} from '../model/world';
import { getCiphers } from 'crypto';

export abstract class ErrorFunction {
    public getName() {
        return this.constructor.name;
    }
    abstract getError(is: Vector, should: Vector): Scalar;
    abstract getErrorDerivative(is: Vector, sholud:Vector): Vector;
}

export class MSE extends ErrorFunction {

    public getError(is: Vector, should: Vector): Scalar {
        let diff = 0;
        for (let i = 0; i < is.length; i++) {
            let d =  is.entries[i] - should.entries[i];
            diff += d * d;
        }
        return diff / is.length;
    }

    public getErrorDerivative(is: Vector, should: Vector): Vector {
        // 2 * (is - should) bzw -2 * (should - is)
        return plus(is, should.getScaled(-1)).scale(2 / is.length);
    }
}

export class WeightedMSE extends ErrorFunction {
    private weightSum: number;

    public constructor(private weights: Vector) {
        super();
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

export abstract class ControllerError extends ErrorFunction {
    abstract getError(finalState: Vector): Scalar;
    abstract getErrorDerivative(finalState: Vector): Vector;
    abstract setSaveErrors(saveErrors: boolean): void;
}

export class SimpleControllerError extends ControllerError {
    public getError(finalState: Vector): Scalar {
        return (0 - finalState.entries[0]) * (0 - finalState.entries[0]);
    }

    public getErrorDerivative(finalState: Vector): Vector {
        return new Vector([- 2 * (0 - finalState.entries[0])]);
    }

    public setSaveErrors(saveErrors: boolean) {
    }
}

export class TruckControllerError extends ControllerError {
    public angleError: Array<number>;
    public yError: Array<number>;
    public errors: Array<number>;

    private saveErrors: boolean = true;

    public constructor(private dock: Point) {
        super();
        this.angleError = [];
        this.yError = [];
        this.errors = [];
    }

    public setSaveErrors(saveErrors: boolean) {
        this.saveErrors = saveErrors;
    }
    public getErrorDerivative(finalState: Vector): Vector {
        let xTrailer = finalState.entries[0];
        let yTrailer = finalState.entries[1];
        let thetaTrailer = finalState.entries[3];

        // Derivative of SSE
        let xDiff = Math.max(xTrailer,-1) - this.dock.x;
        let yDiff = yTrailer - this.dock.y;
        let thetaDiff = thetaTrailer - 0;

        // first 3 do not matter for the error
/*        if (xDiff > 0) {
            console.log(2 * xDiff);
        }*/
        return new Vector([0, 2 * yDiff, 0, 2 * thetaDiff]);
    }

    // 3 elements: x trailer y trailer theta trailer at position 3 4 and 5
    public getError(finalState: Vector) {
        let xTrailer = finalState.entries[0];
        let yTrailer = finalState.entries[1];
        // 2 is cabin angle
        let thetaTrailer = finalState.entries[3];
        // IMPORTANT: x = 0 is at -1 because of the x transformation!
        // we just ignore x < 0 This also explains why it tries to drive a circle with max(xTrailer, 0)
        let xDiff = Math.max(xTrailer, -1) - this.dock.x
        let yDiff = yTrailer - this.dock.y
        let thetaDiff = thetaTrailer - 0

        // We input the final state in emulator output space => angle / Math.PI and y divided by 50

        if (this.saveErrors) {
            this.angleError.push(Math.abs(thetaDiff * Math.PI))
            this.yError.push(Math.abs(yDiff * 50))
        }
        
        let error =  xDiff * xDiff + yDiff * yDiff + thetaDiff * thetaDiff;
        if (this.saveErrors) {
            this.errors.push(error);
        }
        return error;
    }
}

export class CarControllerError extends ControllerError {
    public angleError: Array<number>;
    public yError: Array<number>;
    public errors: Array<number>;

    private saveErrors: boolean = true;

    public constructor(private dock: Point) {
        super();
        this.angleError = [];
        this.yError = [];
        this.errors = [];
    }

    public setSaveErrors(saveErrors: boolean) {
        this.saveErrors = saveErrors;
    }

    public getErrorDerivative(finalState: Vector): Vector {
        let xTrailer = finalState.entries[0];
        let yTrailer = finalState.entries[1];
        let thetaTrailer = finalState.entries[2];

        // Derivative of SSE
        let xDiff = Math.max(xTrailer,-1) - this.dock.x;
        let yDiff = yTrailer - this.dock.y;
        let thetaDiff = thetaTrailer - 0;

        // first 3 do not matter for the error
        return new Vector([2 * xDiff, 2 * 2 * yDiff, 2 * thetaDiff]);
    }

    // 3 elements: x trailer y trailer theta trailer at position 3 4 and 5
    public getError(finalState: Vector) {
        let xTrailer = finalState.entries[0];
        let yTrailer = finalState.entries[1];
        let thetaTrailer = finalState.entries[2];
        // IMPORTANT: x = 0 is at -1 because of the x transformation!
        // we just ignore x < 0 This also explains why it tries to drive a circle with max(xTrailer, 0)
        let xDiff = Math.max(xTrailer, -1) - this.dock.x
        let yDiff = yTrailer - this.dock.y
        let thetaDiff = thetaTrailer - 0

        // We input the final state in emulator output space => angle / Math.PI and y divided by 50
        if (this.saveErrors) {
            this.angleError.push(Math.abs(thetaDiff * Math.PI))
            this.yError.push(Math.abs(yDiff * 50))
        }
    
        let error =  xDiff * xDiff + yDiff * yDiff + thetaDiff * thetaDiff;
        if (this.saveErrors) {
            this.errors.push(error);
        }
        return error;
    }
}
