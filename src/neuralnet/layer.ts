import { Vector, Scalar } from './math'

import { ActivationFunction } from './activation';
import { Unit, AdalineUnit } from './unit';
import { Optimizer } from './optimizers';
import { WeightInitializer } from './weightinitializer';

export class Layer {
    private units: Unit[];
    private debug: boolean;

    constructor(private inputDim: number, private outputDim: number, private activation: ActivationFunction, private optimizerConstructor: () => Optimizer, private unitConstructor: (inputDim: number, activation: ActivationFunction, weightInitializer: WeightInitializer, optimizer: Optimizer) => Unit, weightInitializer: WeightInitializer) {
        this.units = [];
        for (let i = 0; i < outputDim; i++) {
            this.units.push(this.unitConstructor(inputDim, activation, weightInitializer, this.optimizerConstructor()));
        }
    }

    public setDebug(debug: boolean) {
        this.debug = debug;
        for (let unit of this.units) {
            unit.setDebug(debug);
        }
    }

    public getUnits(): Unit[] {
        return this.units;
    }

    public getWeights(): Array<Array<number>> {
        return this.units.map(u => u.getWeights());
    }

    public loadWeights(weights: Array<Array<number>>) {
        if (weights.length != this.units.length) {
            throw new Error("Expected " + this.units.length + " weight vectors but got " + weights.length);
        }
        for (let i = 0; i < this.units.length; i++) {
            this.units[i].loadWeights(weights[i]);
        }
    }

    public fixWeights(fixed: boolean) {
        for (let unit of this.units) {
            unit.fixWeights(fixed);
        }
    }
    public clearInputs() {
        this.units.forEach(u => u.clearInputs());
    }

    public changeOptimizer(optimizerFunc: () => Optimizer) {
        for (let i = 0; i < this.units.length; i++) {
            this.units[i].changeOptimizer(optimizerFunc());
        }
    }

    public forward(input: Vector): Vector {
        if (input.length != this.inputDim) {
            throw new Error("Invalid Input Dimension! Expected " + this.inputDim + ", but got " + input.length);
        }

        let outputs = new Array(this.outputDim);
        for (let i = 0; i < this.outputDim; i++) {
            outputs[i] = this.units[i].forward(input);
        }

        return new Vector(outputs);
    }

    public updateWithAccumulatedWeights() {
        for (let unit of this.units) {
            unit.updateWithAccumulatedWeights();
        }
    }
    /**
     * Returns summed error for each input 
     * @param error error from the downstream layer
     * @param learningRate 
     */
    public backward(error: Vector, accumulateWeightUpdates: boolean): Vector {
        let backpropError = new Array(this.inputDim);
        for (let i = 0; i < this.inputDim; i++) {
            backpropError[i] = 0;
        }

        for (let i = 0; i < this.outputDim; i++) {
            let localError = this.units[i].backward(error.entries[i], accumulateWeightUpdates);

            for (let j = 0; j < this.inputDim; j++) {
                backpropError[j] += localError.entries[j];
            }
        }

        return new Vector(backpropError);
    }
}