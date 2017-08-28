import {Vector, Scalar} from './math';
import {ActivationFunction} from './activation';

export interface Unit {
    forward(input: Vector): Scalar;
    backward(error: Scalar, learningRate: Scalar): Vector;
}

export class AdalineUnit implements Unit {
    private lastSum: Scalar;
    private lastInput: Vector;

    constructor(private weights: Vector, private activation: ActivationFunction) {

    }

    public forward(input: Vector): Scalar {
        this.lastInput = input;
        if (input.length != this.weights.length) {
            throw new Error("Invalid Input Size: expected "  + this.weights.length + ", but got " + input.length);
        }

        this.lastSum = this.weights.multiply(input);
        return this.activation.apply(this.lastSum);
    }

    // Returns derivative wrt to the inputs
    public backward(error: Scalar, learningRate: Scalar): Vector {
        let scalarFactor = error * this.activation.applyDerivative(this.lastSum);
        let weightDerivative: Vector = this.lastInput.getScaled(scalarFactor);
        this.updateWeights(learningRate, weightDerivative);

        let inputDerivative: Vector = this.weights.getScaled(scalarFactor);
        return inputDerivative;
    }

    private updateWeights(learningRate: Scalar, weightDerivative: Vector) {
        this.weights.add(weightDerivative.scale(- learningRate))
    }
}