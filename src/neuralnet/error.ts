import {Vector, Scalar, plus} from './math';

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