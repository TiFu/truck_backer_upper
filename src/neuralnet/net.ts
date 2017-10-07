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
    unitConstructor: (inputDim: number, activation: ActivationFunction) => Unit
    activation: ActivationFunction
}

export class NeuralNet {
    private layers: Layer[];
    private outputDim: number;
    private inputDim: number;
    public errors: Array<number> = [];
    private fixedWeights: boolean;

    constructor(private netConfig: NetConfig) {
        this.fixedWeights = false;
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

    public getLayers(): Layer[] {
        return this.layers;
    }
    public getWeights(): Array<Array<Array<number>>> {
        return this.layers.map(l => l.getWeights());
    }

    public loadWeights(weights: Array<Array<Array<number>>>) {
        for (let i = 0; i < this.layers.length; i++) {
            this.layers[i].loadWeights(weights[i]);
        }
    }
    public getOutputDim(): number {
        return this.outputDim;
    }

    public getInputDim(): number {
        return this.inputDim;
    }

    public fixWeights(fixed: boolean) {
        for (let layer of this.layers) {
            layer.fixWeights(fixed);
        }
    }

    public updateWithAccumulatedWeights() {
        for (let layer of this.layers) {
            layer.updateWithAccumulatedWeights();
        }        
    }
    
    public forward(input: Vector): Vector {
        let nextInput = input;
        for (let i = 0; i < this.netConfig.layerConfigs.length; i++) {
            nextInput = this.layers[i].forward(nextInput);
        }
        return nextInput;
    }

    public backwardWithGradient(gradient: Vector, accumulateWeigthUpdates: boolean): Vector {
        let error = gradient;
        for (let i = this.netConfig.layerConfigs.length - 1; i >= 0; i--) {
            error = this.layers[i].backward(error, this.netConfig.learningRate, accumulateWeigthUpdates);
        }
        return error;        
    }

    public backward(output: Vector, expected: Vector): Vector {
        let error = this.netConfig.errorFunction.getErrorDerivative(output, expected);
        this.errors.push(this.netConfig.errorFunction.getError(output, expected));
        return this.backwardWithGradient(error, false);
    }
}