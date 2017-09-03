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
        return 0.5 * diff;
    }

    public getErrorDerivative(is: Vector, should: Vector): Vector {
        return plus(is, should.getScaled(-1));
    }
}