import { Scalar } from './math'

export abstract class ActivationFunction {

    public getName(): string {
        return this.constructor.name;
    }

    public abstract apply(input: Scalar): Scalar;
    public abstract applyDerivative(input: Scalar): Scalar;
}

export class Tanh extends ActivationFunction {
    apply(input: Scalar) {
        return Math.tanh(input);
    }

    // TODO: do we assume that the input is tanh(x) or x?
    applyDerivative(input: Scalar) {
        return 1 - this.apply(input) * this.apply(input);
    }
}

export class Sigmoid extends ActivationFunction {

    apply(input: Scalar) {
        return 1 / (1 + Math.exp(-input));
    }

    applyDerivative(input: Scalar) {
        return this.apply(input) * (1 - this.apply(input))
    }
}

export class ReLu extends ActivationFunction {

    public constructor(private epsilon: number) {
        super();
        if (epsilon > 1) {
            throw new Error("ReLu needs an epsilon <= 1");
        }
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

export class Linear extends ActivationFunction {
    apply(input: Scalar) {
        return input;
    }

    // TODO: do we assume that the input is tanh(x) or x?
    applyDerivative(input: Scalar) {
        return 1;
    }

}