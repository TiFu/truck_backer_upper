"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const math_1 = require("./math");
class AdalineUnit {
    constructor(inputDim, activation, initialWeightRange) {
        this.inputDim = inputDim;
        this.activation = activation;
        this.fixedWeights = false;
        this.lastInput = [];
        this.weights = this.getRandomWeights(inputDim + 1, initialWeightRange);
        this.resetAccumulatedWeights();
    }
    clearInputs() {
        this.lastInput = [];
    }
    setDebug(debug) {
        this.debug = debug;
    }
    getLastUpdate() {
        return this.lastUpdate;
    }
    getRandomWeights(inputDim, initialWeightRange) {
        let random = [];
        for (let i = 0; i < inputDim; i++) {
            random.push(Math.random() * initialWeightRange - 0.5 * initialWeightRange);
        }
        console.log("Initial Weights: " + random);
        return new math_1.Vector(random);
    }
    setWeights(weights) {
        if (weights.length != this.weights.length) {
            throw new Error("Unit#setWeights() needs to use inputDim + 1 as dimension.");
        }
        this.weights = weights;
    }
    saveWeights() {
        return this.weights;
    }
    loadWeights(weights) {
        this.weights = new math_1.Vector(weights);
    }
    getWeights() {
        return this.weights.entries;
    }
    forward(input) {
        input = input.getWithNewElement(1);
        this.lastInput.push(input);
        if (input.length != this.weights.length) {
            throw new Error("Invalid Input Size: expected " + this.weights.length + ", but got " + input.length);
        }
        this.lastSum = this.weights.multiply(input);
        if (Number.isNaN(this.lastSum)) {
            console.log("[Unit] Input: " + input);
            console.log("[Unit] Last Sum: " + this.lastSum);
            console.log("[Unit] Weights: ", this.weights.entries);
            console.log("[Unit] Sum: ", this.lastSum);
        }
        let activated = this.activation.apply(this.lastSum);
        if (Number.isNaN(activated))
            console.log("[Unit] Activated: ", activated, "Last Sum: ", this.lastSum);
        return activated;
    }
    fixWeights(fixed) {
        this.fixedWeights = fixed;
    }
    resetAccumulatedWeights() {
        let entries = new Array(this.weights.length);
        entries.fill(0);
        this.accumulatedWeights = new math_1.Vector(entries);
    }
    updateWithAccumulatedWeights() {
        this.updateWeights(this.accumulatedWeights);
        this.resetAccumulatedWeights();
    }
    backward(errorDerivative, learningRate, accumulateWeigthUpdates) {
        let activationDerivative = this.activation.applyDerivative(this.lastSum);
        let scalarFactor = errorDerivative * activationDerivative;
        let inputDerivative = this.weights.getScaled(scalarFactor);
        if (!this.fixedWeights) {
            let weightDerivative = this.lastInput.pop().getScaled(scalarFactor);
            let update = this.calculateWeightUpdate(learningRate, weightDerivative);
            if (accumulateWeigthUpdates) {
                this.accumulatedWeights.add(update);
            }
            else {
                this.updateWeights(update);
            }
        }
        return inputDerivative.getWithoutLastElement();
    }
    calculateWeightUpdate(learningRate, weightDerivative) {
        return weightDerivative.scale(-learningRate);
    }
    updateWeights(update) {
        this.lastUpdate = update;
        this.weights.add(update);
    }
}
exports.AdalineUnit = AdalineUnit;
//# sourceMappingURL=unit.js.map