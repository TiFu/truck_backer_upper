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

export class Sigmoid implements ActivationFunction {
    getName() {
        return "sigmoid"
    }

    apply(input: Scalar) {
        return 1 / (1 + Math.exp(-input));
    }

    applyDerivative(input: Scalar) {
        return this.apply(input) * (1 - this.apply(input))
    }
}

export class ReLu implements ActivationFunction {
    constructor(private epsilon: number) {
        if (epsilon > 1) {
            throw new Error("ReLu needs an epsilon <= 1");
        }
    }

    getName() {
        return "relu";
    }

    apply(input: Scalar) {
        return Math.max(input, this.epsilon * input);
    }

    applyDerivative(input: Scalar) {
        if (input > 0) {
            return 1;
        } else {
            return this.epsilon;
        }
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