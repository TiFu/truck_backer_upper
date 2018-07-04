import { Vector, Scalar } from './math';
import { ActivationFunction } from './activation';
import { Optimizer } from './optimizers';
import { WeightInitializer } from './weightinitializer';

export interface Unit {
    forward(input: Vector): Scalar;
    backward(error: Scalar, accumulatedWeightUpdates: boolean): Vector;
    updateWithAccumulatedWeights(): void;
    fixWeights(fixed: boolean): void;
    getWeights(): Array<number>;
    loadWeights(weights: Array<number>): void;
    setWeights(weights: Vector): void;
    getLastUpdate(): Vector;
    setDebug(debug: boolean): void;
    clearInputs(): void;
    changeOptimizer(optimizer: Optimizer): void;
}

export class AdalineUnit implements Unit {
    public lastSum: Scalar;
    private lastInput: Vector[];
    private fixedWeights: boolean;
    private accumulatedWeights: Vector;
    private batchCounter: number;
    private weights: Vector;
    private lastUpdate: Vector;
    private debug: boolean;

    constructor(private inputDim: number, private activation: ActivationFunction, weightInitializer: WeightInitializer, private optimizer: Optimizer) {
        this.fixedWeights = false;
        this.lastInput = []
        this.weights = weightInitializer.initialize(inputDim);
        this.resetAccumulatedWeights();
    }

    public changeOptimizer(optimizer: Optimizer) {
        this.optimizer = optimizer;
    }

    public clearInputs() {
        this.lastInput = []
    }
    public setDebug(debug: boolean) {
        this.debug = debug;
    }
    public getLastUpdate(): Vector {
        return this.lastUpdate;
    }

    public setWeights(weights: Vector) {
        if (weights.length != this.weights.length) {
            throw new Error("Expected " + this.weights.length + " weights including bias weight, but got " + weights.length);
        }
        this.weights = weights;
    }
    public saveWeights(): Vector {
        return this.weights
    }

    public loadWeights(weights: Array<number>) {
        this.setWeights(new Vector(weights));
    }

    public getWeights(): Array<number> {
        return this.weights.entries;
    }

    public forward(input: Vector): Scalar {
        input = input.getWithNewElement(1); // add bias

        // only need the last input for weight derivative
        if (!this.fixedWeights) {
            this.lastInput.push(input);
        }
        if (input.length != this.weights.length) {
            throw new Error("Invalid Input Size: expected " + this.weights.length + ", but got " + input.length);
        }

        this.lastSum = this.weights.multiply(input); // last is bias

        let activated = this.activation.apply(this.lastSum);

        return activated;
    }

    public fixWeights(fixed: boolean) {
        this.fixedWeights = fixed;
    }

    private resetAccumulatedWeights() {
        let entries = new Array(this.weights.length);
        entries.fill(0);
        this.accumulatedWeights = new Vector(entries);
        this.batchCounter = 0;
    }
    public updateWithAccumulatedWeights() {
        for (let i = 0; i < this.accumulatedWeights.length; i++) {
            if (isNaN(this.accumulatedWeights.entries[i])) {
                throw new Error("Found NaN in weight update!")
            }
        }
        this.updateWeights(this.accumulatedWeights.scale(1 / this.batchCounter));
        this.resetAccumulatedWeights();
    }

    // Returns derivative wrt to the inputs
    public backward(errorDerivative: Scalar, accumulateWeigthUpdates: boolean): Vector {
        let activationDerivative = this.activation.applyDerivative(this.lastSum);
        let scalarFactor = errorDerivative * activationDerivative;

        let inputDerivative: Vector = this.weights.getScaled(scalarFactor);
        if (inputDerivative.entries.reduce((prev, next) => prev || Number.isNaN(next), false)) {
            throw new Error("Found NaN in backward pass!");
        }
        if (!this.fixedWeights) {
            let weightDerivative: Vector = this.lastInput.pop().getScaled(scalarFactor);
            let update = weightDerivative;
            if (accumulateWeigthUpdates) {
                this.accumulatedWeights.add(update);
                this.batchCounter++;
            } else {
                this.updateWeights(update);
            }
        }
        return inputDerivative.getWithoutLastElement();
    }

    private updateWeights(update: Vector) {
        // calculate update for current batch
        update = this.optimizer.calculateUpdate(update);
        this.lastUpdate = update;
        this.weights.add(update);
    }
}
