import {Vector, Scalar} from './math'

import {ActivationFunction} from './activation';
import {Unit, AdalineUnit} from './unit';

export class Layer {
    private units: Unit[];

    constructor(private inputDim: number, private outputDim: number, private activation: ActivationFunction, private unitConstructor: (weights: Vector, activation: ActivationFunction) => Unit) {
        this.units = [];
        for (let i = 0; i < outputDim; i++) {
            this.units.push(this.unitConstructor(this.getRandomWeights(inputDim + 1), activation));
        }
    }

    private getRandomWeights(inputDim: number): Vector { 
        let random = [];
        for (let i = 0; i < inputDim; i++) {
//            random.push(0.1);
            random.push(Math.random() * (0.6) - 0.3); // [-0.3, 0.6]
        }
        return new Vector(random);
    }

    public forward(input: Vector): Vector {
        if (input.length != this.inputDim) {
            throw new Error("Invalid Input Dimension! Expected " + this.inputDim + ", but got " + input.length);
        }

        // TODO: add bias
        let biasedInput = input.getWithNewElement(1);
        let outputs = new Array(this.outputDim);
        for (let i = 0; i < this.outputDim; i++) {
            outputs[i] = this.units[i].forward(biasedInput);
        }
        return new Vector(outputs);
    }

    /**
     * Returns summed error for each input 
     * @param error error from the downstream layer
     * @param learningRate 
     */
    public backward(error: Vector, learningRate: Scalar): Vector {
        let backpropError = new Array(this.inputDim);
        for (let i = 0; i < this.inputDim; i++) {
            backpropError[i] = 0;
        }
        for (let i = 0; i < this.outputDim; i++) {
            let localError = this.units[i].backward(error.entries[i], learningRate);
            for (let j = 0; j < this.inputDim; j++) {
                backpropError[j] += localError.entries[j];
            }
        }

        return new Vector(backpropError);
    }
}