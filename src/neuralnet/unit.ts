import {Vector, Scalar} from './math';
import {ActivationFunction} from './activation';

export interface Unit {
    forward(input: Vector): Scalar;
    backward(error: Scalar, learningRate: Scalar): Vector;
    getWeights(): Vector;
}

export class AdalineUnit implements Unit {
    private lastSum: Scalar;
    private lastInput: Vector;

    constructor(private weights: Vector, private activation: ActivationFunction) {

    }

    public getWeights(): Vector {
        return this.weights;
    }

    public forward(input: Vector): Scalar {
        this.lastInput = input;
        if (input.length != this.weights.length) {
            throw new Error("Invalid Input Size: expected "  + this.weights.length + ", but got " + input.length);
        }

        this.lastSum = this.weights.multiply(input);
        if (Number.isNaN(this.lastSum)) {
            console.log("[Unit] Weights: ", this.weights.entries);
            console.log("[Unit] Sum: ", this.lastSum);
        }
        let activated = this.activation.apply(this.lastSum);
        if (Number.isNaN(activated))
            console.log("[Unit] Activated: ", activated, "Last Sum: ", this.lastSum);
        return activated;
    }

    // Returns derivative wrt to the inputs
    public backward(error: Scalar, learningRate: Scalar): Vector {
        let activationDerivative = this.activation.applyDerivative(this.lastSum);
        let scalarFactor = error * activationDerivative;
        let weightDerivative: Vector = this.lastInput.getScaled(scalarFactor);
        let inputDerivative: Vector = this.weights.getScaled(scalarFactor);
        if (weightDerivative.isEntryNaN()) { 
            console.log("[Unit] Activation Derivative: ", activationDerivative);
            console.log("[Unit] Error: ", error);
            console.log("[Unit] Weight Derivative: ", weightDerivative.entries);
            console.log("[Unit] Input Derivative: ", inputDerivative.entries);
        }
        this.updateWeights(learningRate, weightDerivative);
        if (this.weights.isEntryNaN()) {
            console.log("[Unit][Backprop] Weights: ", this.weights.entries);            
        }
        return inputDerivative;
    }

    private updateWeights(learningRate: Scalar, weightDerivative: Vector) {
        this.weights.add(weightDerivative.scale(- learningRate))
    }
}