import {Vector} from './math';
import { NeuralNet } from './net';

export interface Emulator {

    forward(input: Vector): void;

    backward(error: Vector): Vector;

    setNotTrainable(trainable: boolean): void;
}

export class NeuralNetEmulator implements Emulator{

    public constructor(private net: NeuralNet) {

    }

    public setNotTrainable(notTrainable: boolean): void {
        this.net.fixWeights(notTrainable);
    }

    public forward(input: Vector): void {
        this.net.forward(input);
    }

    public backward(error: Vector): Vector {
        return this.net.backwardWithGradient(error, false);
    }
}