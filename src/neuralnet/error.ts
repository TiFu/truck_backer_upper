import {Vector, Scalar} from './math';

export interface ErrorFunction {
    getError(is: Vector, should: Vector): Scalar;
    getErrorDerivative(is: Vector, sholud:Vector): Vector;
}

export class MSE implements ErrorFunction {
        
}