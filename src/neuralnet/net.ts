import {Scalar, Vector} from './math'
import {Layer} from './layer'
import {ActivationFunction} from './activation';
import {Unit} from './unit'
import {ErrorFunction} from './error'
export interface NetConfig {
    layers: number,
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

    constructor(private netConfig: NetConfig) {
        this.layers = new Array(netConfig.layers);
        let input = netConfig.inputs;

        for (let i = 0; i < netConfig.layers; i++) {
            let layerConfig = netConfig.layerConfigs[i];
            let output = layerConfig.neuronCount;
            this.layers[i] = new Layer(input, output, layerConfig.activation, layerConfig.unitConstructor);
            input = output; // input of next layer is output of this layer
        }
    }

    public forward(input: Vector): Vector {
        let nextInput = input;
        for (let i = 0; i < this.netConfig.layers; i++) {
            nextInput = this.layers[i].forward(nextInput);
        }
        return nextInput;
    }

    public backward(output: Vector, expected: Vector): Vector {
        let error = this.netConfig.errorFunction.getErrorDerivative(output, expected);
        for (let i = this.netConfig.layers - 1; i >= 0; i--) {
            error = this.layers[i].backward(error, this.netConfig.learningRate);
        }
        return error;
    }
}