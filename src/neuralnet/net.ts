import {Scalar, Vector} from './math'
import {Layer} from './layer'
import {ActivationFunction} from './activation';
import {Unit} from './unit'
import {ErrorFunction} from './error'
import {Optimizer} from './optimizers';
import { WeightInitializer } from './weightinitializer';

export interface NetConfig {
    inputs: number,
    errorFunction: ErrorFunction
    optimizer: () => Optimizer,
    layerConfigs: LayerConfig[];
}

export interface LayerConfig {
    neuronCount: number
    weightInitializer: WeightInitializer
    unitConstructor: (inputDim: number, activation: ActivationFunction, weightInitRange: WeightInitializer, optimizer: Optimizer) => Unit
    activation: ActivationFunction
}

export class NeuralNet {
    private layers: Layer[];
    private outputDim: number;
    private inputDim: number;
    private fixedWeights: boolean;
    private debug: boolean = false;

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
            this.layers[i] = new Layer(input, output, layerConfig.activation, netConfig.optimizer, layerConfig.unitConstructor, layerConfig.weightInitializer);
            input = output; // input of next layer is output of this layer
        }
        this.outputDim = lastNeuronCount;
    }

    public clearInputs() {
        this.layers.forEach(l => l.clearInputs());
    }

    public setDebugMode(debug: boolean) {
        this.debug = debug;
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
            error = this.layers[i].backward(error, accumulateWeigthUpdates);
        }
        return error;        
    }

    public backward(output: Vector, expected: Vector, accumulateWeigthUpdates: boolean = false): Vector {
        let error = this.netConfig.errorFunction.getErrorDerivative(output, expected);

        return this.backwardWithGradient(error, accumulateWeigthUpdates);
    }
}