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
        return (Math.exp(input) - Math.exp(-input)) / (Math.exp(input)  + Math.exp(-input));
    }

    // TODO: do we assume that the input is tanh(x) or x?
    applyDerivative(input: Scalar) {
        return 1 - this.apply(input) * this.apply(input);
    }
}