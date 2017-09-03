import {Scalar} from './math'

export interface ActivationFunction {

    getName(): string;
    apply(input: Scalar): Scalar;
    applyDerivative(input: Scalar): Scalar;
}

export class Tanh implements ActivationFunction {
    
    getName() {
        return "tanh";
    }

    apply(input: Scalar) {
        return Math.tanh(input);
    }

    // TODO: do we assume that the input is tanh(x) or x?
    applyDerivative(input: Scalar) {
        return 1 - this.apply(input) * this.apply(input);
    }
}

export class Linear implements ActivationFunction {
    getName() {
        return "linear";
    }

    apply(input: Scalar) {
        return input;
    }

    // TODO: do we assume that the input is tanh(x) or x?
    applyDerivative(input: Scalar) {
        return 1;
    }
    
}