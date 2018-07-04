import { Vector } from './math';
import { NeuralNet } from './net';

export interface Emulator {

    forward(input: Vector): void;

    backward(error: Vector): Vector;

    setNotTrainable(trainable: boolean): void;

    clearInputs(): void;
}

// TODO: chart: multiply x-axis by 100
export class NeuralNetEmulator implements Emulator {

    public constructor(private net: NeuralNet) {

    }

    public clearInputs() {
        this.net.clearInputs();
    }
    public setNotTrainable(notTrainable: boolean): void {
        this.net.fixWeights(notTrainable);
    }

    public forward(input: Vector): void {
        this.net.forward(input);
    }

    public backward(error: Vector): Vector {
        let neuralNetDerivative = this.net.backwardWithGradient(error, false);
        return neuralNetDerivative;
    }
}