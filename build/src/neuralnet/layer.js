"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const math_1 = require("./math");
class Layer {
    constructor(inputDim, outputDim, activation, unitConstructor, initialWeightRange) {
        this.inputDim = inputDim;
        this.outputDim = outputDim;
        this.activation = activation;
        this.unitConstructor = unitConstructor;
        this.units = [];
        for (let i = 0; i < outputDim; i++) {
            this.units.push(this.unitConstructor(inputDim, activation, initialWeightRange));
        }
    }
    setDebug(debug) {
        this.debug = debug;
        for (let unit of this.units) {
            unit.setDebug(debug);
        }
        this.units[3].setDebug(true);
        this.units[4].setDebug(true);
        this.units[5].setDebug(true);
    }
    getUnits() {
        return this.units;
    }
    getWeights() {
        return this.units.map(u => u.getWeights());
    }
    loadWeights(weights) {
        for (let i = 0; i < this.units.length; i++) {
            this.units[i].loadWeights(weights[i]);
        }
    }
    fixWeights(fixed) {
        for (let unit of this.units) {
            unit.fixWeights(fixed);
        }
    }
    clearInputs() {
        this.units.forEach(u => u.clearInputs());
    }
    forward(input) {
        if (input.length != this.inputDim) {
            throw new Error("Invalid Input Dimension! Expected " + this.inputDim + ", but got " + input.length);
        }
        let outputs = new Array(this.outputDim);
        for (let i = 0; i < this.outputDim; i++) {
            outputs[i] = this.units[i].forward(input);
        }
        return new math_1.Vector(outputs);
    }
    updateWithAccumulatedWeights() {
        for (let unit of this.units) {
            unit.updateWithAccumulatedWeights();
        }
    }
    backward(error, learningRate, accumulateWeightUpdates) {
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
        return new math_1.Vector(backpropError);
    }
}
exports.Layer = Layer;
//# sourceMappingURL=layer.js.map