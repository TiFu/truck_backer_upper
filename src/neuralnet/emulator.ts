import {Vector} from './math';
import { NeuralNet } from './net';

export interface Emulator {

    forward(input: Vector): void;

    backward(error: Vector): Vector;

    setNotTrainable(trainable: boolean): void;
}

export class NeuralNetEmulator implements Emulator{
    
    public constructor(private net: NeuralNet, private comparisonEmulator: Emulator = null) {

    }

    public setNotTrainable(notTrainable: boolean): void {
        this.net.fixWeights(notTrainable);
    }

    public forward(input: Vector): void {
        this.comparisonEmulator.forward(input);
        this.net.forward(input);
    }

    public backward(error: Vector): Vector {
        let neuralNetDerivative = this.net.backwardWithGradient(error, false);
        let comparisonDerivative = this.comparisonEmulator.backward(error);
    /*    console.log("Comparison", comparisonDerivative.entries);
        console.log("NN: ", neuralNetDerivative.entries);
        let diff = [];
        for (let i = 0; i < comparisonDerivative.entries.length; i++) {
            diff.push( neuralNetDerivative.entries[i] / comparisonDerivative.entries[i]);
        }
        console.log("Diffs: ", diff);
        console.log("");*/
        return neuralNetDerivative;
    }
}