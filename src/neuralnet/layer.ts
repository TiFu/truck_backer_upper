import {Vector, Scalar} from './math'

import {ActivationFunction} from './activation';
import {Unit, AdalineUnit} from './unit';

export class Layer {
    private units: Unit[];

    constructor(private inputDim: number, private outputDim: number, private activation: ActivationFunction, private unitConstructor: (inputDim: number, activation: ActivationFunction) => Unit) {
        this.units = [];
        for (let i = 0; i < outputDim; i++) {
            this.units.push(this.unitConstructor(inputDim, activation));
        }
    }

    public getUnits(): Unit[] {
        return this.units;
    }

    public getWeights(): Array<Array<number>> {
        return this.units.map(u => u.getWeights());
    }

    public loadWeights(weights: Array<Array<number>>) {
        for (let i = 0; i < this.units.length; i++) {
            this.units[i].loadWeights(weights[i]);
        }
    }

    public fixWeights(fixed: boolean) {
        for (let unit of this.units) {
            unit.fixWeights(fixed);
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
    public backward(error: Vector, learningRate: Scalar, accumulateWeightUpdates: boolean): Vector {
        let backpropError = new Array(this.inputDim);
        for (let i = 0; i < this.inputDim; i++) {
            backpropError[i] = 0;
        }
        for (let i = 0; i < this.outputDim; i++) {
            let localError = this.units[i].backward(error.entries[i], learningRate, accumulateWeightUpdates);
            for (let j = 0; j < this.inputDim; j++) {
                backpropError[j] += localError.entries[j];
            }
        }

        return new Vector(backpropError);
    }
}