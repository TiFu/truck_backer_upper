import {Vector, Scalar} from './math';
import {ActivationFunction} from './activation';

export interface Unit {
    forward(input: Vector): Scalar;
    backward(error: Scalar, learningRate: Scalar, accumulatedWeightUpdates: boolean): Vector;
    updateWithAccumulatedWeights(): void;
    fixWeights(fixed: boolean): void;
    getWeights(): Array<number>;
    loadWeights(weights: Array<number>): void;
    setWeights(weights: Vector): void;
    getLastUpdate(): Vector;
}

export class AdalineUnit implements Unit {
    private lastSum: Scalar;
    private lastInput: Vector;
    private fixedWeights: boolean;
    private accumulatedWeights: Vector;
    private weights: Vector;
    private lastUpdate: Vector;

    constructor(private inputDim: number, private activation: ActivationFunction) {
        this.fixedWeights = false;
        this.weights = this.getRandomWeights(inputDim + 1); // bias
        this.resetAccumulatedWeights();
    }

    public getLastUpdate(): Vector {
        return this.lastUpdate;
    }

    private getRandomWeights(inputDim: number): Vector { 
        let random = [];
        for (let i = 0; i < inputDim; i++) {
            random.push(Math.random() * (0.6) - 0.3); // [-0.3, 0.3]
        }
        return new Vector(random);
    }

    public setWeights(weights: Vector) {
        if (weights.length != this.weights.length) {
            throw new Error("Unit#setWeights() needs to use inputDim + 1 as dimension.");
        }
        this.weights = weights;
    }
    public saveWeights(): Vector {
        return this.weights
    }

    public loadWeights(weights: Array<number>) {
        this.weights = new Vector(weights);
    }

    public getWeights(): Array<number> {
        return this.weights.entries;
    }

    public forward(input: Vector): Scalar {
        input = input.getWithNewElement(1); // add bias

        this.lastInput = input;
        if (input.length != this.weights.length) {
            throw new Error("Invalid Input Size: expected "  + this.weights.length + ", but got " + input.length);
        }

        this.lastSum = this.weights.multiply(input); // last is bias

        if (Number.isNaN(this.lastSum)) {
            console.log("[Unit] Weights: ", this.weights.entries);
            console.log("[Unit] Sum: ", this.lastSum);
        }
        let activated = this.activation.apply(this.lastSum);
        if (Number.isNaN(activated))
            console.log("[Unit] Activated: ", activated, "Last Sum: ", this.lastSum);
            return activated;
    }

    public fixWeights(fixed: boolean) {
        this.fixedWeights = fixed;
    }

    private resetAccumulatedWeights() {
        let entries = new Array(this.weights.length);
        entries.fill(0);
        this.accumulatedWeights = new Vector(entries);
    }
    public updateWithAccumulatedWeights() {
        this.updateWeights(this.accumulatedWeights);
    }

    // Returns derivative wrt to the inputs
    public backward(errorDerivative: Scalar, learningRate: Scalar, accumulateWeigthUpdates: boolean): Vector {
        let activationDerivative = this.activation.applyDerivative(this.lastSum);
        let scalarFactor = errorDerivative * activationDerivative;

        let inputDerivative: Vector = this.weights.getScaled(scalarFactor);
        if (!this.fixedWeights) {
            let weightDerivative: Vector = this.lastInput.getScaled(scalarFactor);
            let update = this.calculateWeightUpdate(learningRate, weightDerivative);

            if (accumulateWeigthUpdates) {
                this.accumulatedWeights.add(update);
            } else {
                this.updateWeights(update);
            }
        }

        return inputDerivative.getWithoutLastElement();
    }

    private calculateWeightUpdate(learningRate: Scalar, weightDerivative: Vector): Vector {
        return weightDerivative.scale(- learningRate);
    }
    private updateWeights( update: Vector) {
        this.lastUpdate = update;
        this.weights.add(update)
    }
}