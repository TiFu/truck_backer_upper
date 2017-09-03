import {Scalar, Vector} from './math'
import {Layer} from './layer'
import {ActivationFunction} from './activation';
import {Unit} from './unit'
import {ErrorFunction} from './error'
export interface NetConfig {
    inputs: number,
    learningRate: number,
    errorFunction: ErrorFunction,
    layerConfigs: LayerConfig[];
}

export interface LayerConfig {
    neuronCount: number
    unitConstructor: (weights: Vector, activation: ActivationFunction) => Unit
    activation: ActivationFunction
}

export class NeuralNet {
    private layers: Layer[];
    private outputDim: number;
    private inputDim: number;

    constructor(private netConfig: NetConfig) {
        this.layers = new Array(netConfig.layerConfigs.length);
        let input = netConfig.inputs;
        this.inputDim = input;
        let lastNeuronCount = -1;
        for (let i = 0; i < netConfig.layerConfigs.length; i++) {
            let layerConfig = netConfig.layerConfigs[i];
            let output = layerConfig.neuronCount;
            lastNeuronCount = output;
            this.layers[i] = new Layer(input, output, layerConfig.activation, layerConfig.unitConstructor);
            input = output; // input of next layer is output of this layer
        }
        this.outputDim = lastNeuronCount;
    }

    public getOutputDim(): number {
        return this.outputDim;
    }

    public getInputDim(): number {
        return this.inputDim;
    }

    public forward(input: Vector): Vector {
        let nextInput = input;
        for (let i = 0; i < this.netConfig.layerConfigs.length; i++) {
            nextInput = this.layers[i].forward(nextInput);
        }
        return nextInput;
    }

    public backward(output: Vector, expected: Vector): Vector {
        let error = this.netConfig.errorFunction.getErrorDerivative(output, expected);
        console.log("[Net] Remaining Error: ", this.netConfig.errorFunction.getError(output, expected));
        for (let i = this.netConfig.layerConfigs.length - 1; i >= 0; i--) {
            error = this.layers[i].backward(error, this.netConfig.learningRate);
        }
        return error;
    }
}