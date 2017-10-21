"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const layer_1 = require("./layer");
class NeuralNet {
    constructor(netConfig) {
        this.netConfig = netConfig;
        this.errors = [];
        this.debug = false;
        this.fixedWeights = false;
        this.layers = new Array(netConfig.layerConfigs.length);
        let input = netConfig.inputs;
        this.inputDim = input;
        let lastNeuronCount = -1;
        for (let i = 0; i < netConfig.layerConfigs.length; i++) {
            let layerConfig = netConfig.layerConfigs[i];
            let output = layerConfig.neuronCount;
            lastNeuronCount = output;
            this.layers[i] = new layer_1.Layer(input, output, layerConfig.activation, layerConfig.unitConstructor, netConfig.weightInitRange);
            input = output;
        }
        this.outputDim = lastNeuronCount;
    }
    setDebugMode(debug) {
        this.debug = debug;
        this.layers[0].setDebug(true);
    }
    getLayers() {
        return this.layers;
    }
    getWeights() {
        return this.layers.map(l => l.getWeights());
    }
    loadWeights(weights) {
        for (let i = 0; i < this.layers.length; i++) {
            this.layers[i].loadWeights(weights[i]);
        }
    }
    getOutputDim() {
        return this.outputDim;
    }
    getInputDim() {
        return this.inputDim;
    }
    fixWeights(fixed) {
        for (let layer of this.layers) {
            layer.fixWeights(fixed);
        }
    }
    updateWithAccumulatedWeights() {
        for (let layer of this.layers) {
            layer.updateWithAccumulatedWeights();
        }
    }
    forward(input) {
        let nextInput = input;
        for (let i = 0; i < this.netConfig.layerConfigs.length; i++) {
            nextInput = this.layers[i].forward(nextInput);
        }
        return nextInput;
    }
    backwardWithGradient(gradient, accumulateWeigthUpdates) {
        let error = gradient;
        for (let i = this.netConfig.layerConfigs.length - 1; i >= 0; i--) {
            error = this.layers[i].backward(error, this.netConfig.learningRate, accumulateWeigthUpdates);
        }
        return error;
    }
    backward(output, expected) {
        let error = this.netConfig.errorFunction.getErrorDerivative(output, expected);
        let computedError = this.netConfig.errorFunction.getError(output, expected);
        this.errors.push(computedError);
        return this.backwardWithGradient(error, false);
    }
}
exports.NeuralNet = NeuralNet;
//# sourceMappingURL=net.js.map