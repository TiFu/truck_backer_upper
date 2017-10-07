"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_typescript_1 = require("mocha-typescript");
const chai_1 = require("chai");
const activation_1 = require("../../src/neuralnet/activation");
const unit_1 = require("../../src/neuralnet/unit");
const math_1 = require("../../src/neuralnet/math");
const net_1 = require("../../src/neuralnet/net");
const error_1 = require("../../src/neuralnet/error");
var hiddenLayer = {
    neuronCount: 2,
    unitConstructor: (input, activation) => new unit_1.AdalineUnit(input, activation),
    activation: new activation_1.Sigmoid()
};
var outputLayer = {
    neuronCount: 1,
    unitConstructor: (inputDim, activation) => new unit_1.AdalineUnit(inputDim, activation),
    activation: new activation_1.Sigmoid()
};
var netConfig = {
    inputs: 2,
    learningRate: 0.45,
    errorFunction: new error_1.MSE(),
    layerConfigs: [
        hiddenLayer,
        outputLayer
    ]
};
let NeuralNetTest = class NeuralNetTest {
    before() {
        this.net = new net_1.NeuralNet(netConfig);
        let layers = this.net.getLayers();
        let hiddenLayerUnits = layers[0].getUnits();
        hiddenLayerUnits[0].setWeights(new math_1.Vector([0.4, 0.1, 0]));
        hiddenLayerUnits[1].setWeights(new math_1.Vector([-0.1, -0.1, 0]));
        let outputLayerUnits = layers[1].getUnits();
        outputLayerUnits[0].setWeights(new math_1.Vector([0.06, -0.4, 0]));
    }
    testForward() {
        let result = this.net.forward(new math_1.Vector([1, 1]));
        chai_1.expect(result.length).to.equal(1);
        chai_1.expect(result.entries[0]).to.equal(0.46438072894227506);
    }
    testBackward() {
        let result = this.net.forward(new math_1.Vector([1, 1]));
        let inputDerivative = this.net.backward(result, new math_1.Vector([1]));
        let layers = this.net.getLayers();
        let outputUnit = layers[1].getUnits()[0];
        let outputUpdate = outputUnit.getLastUpdate();
        chai_1.expect(outputUpdate.entries[0]).to.equal(0.037317287864407224);
        chai_1.expect(outputUpdate.entries[1]).to.equal(0.026988067279229387);
        let outputWeights = outputUnit.getWeights();
        chai_1.expect(outputWeights[0]).to.equal(0.09731728786440721);
        chai_1.expect(outputWeights[1]).to.equal(-0.37301193272077066);
        let hiddenLayer = layers[0];
        let hiddenLayerUnits = hiddenLayer.getUnits();
        let unit1Weights = hiddenLayerUnits[0].getWeights();
        let unit1Updates = hiddenLayerUnits[0].getLastUpdate();
        chai_1.expect(unit1Updates.entries[0]).to.equal(0.0008453276290836732);
        chai_1.expect(unit1Updates.entries[1]).to.equal(0.0008453276290836732);
        chai_1.expect(unit1Weights[0]).to.equal(0.4008453276290837);
        chai_1.expect(unit1Weights[1]).to.equal(0.10084532762908367);
        let unit2Weights = hiddenLayerUnits[1].getWeights();
        let wu = hiddenLayerUnits[1].getLastUpdate();
        chai_1.expect(wu.entries[0]).to.equal(-0.005935582764750712);
        chai_1.expect(wu.entries[1]).to.equal(-0.005935582764750712);
        chai_1.expect(unit2Weights[0]).to.equal(-0.10593558276475072);
        chai_1.expect(unit2Weights[1]).to.equal(-0.10593558276475072);
        let result2 = this.net.forward(new math_1.Vector([1, 1]));
        chai_1.expect(result2.entries[0]).to.equal(0.4885796481617482);
    }
    xOR() {
        var hiddenLayer = {
            neuronCount: 2,
            unitConstructor: (input, activation) => new unit_1.AdalineUnit(input, activation),
            activation: new activation_1.Sigmoid()
        };
        var outputLayer = {
            neuronCount: 1,
            unitConstructor: (inputDim, activation) => new unit_1.AdalineUnit(inputDim, activation),
            activation: new activation_1.Sigmoid()
        };
        var netConfig = {
            inputs: 2,
            learningRate: 0.05,
            errorFunction: new error_1.MSE(),
            layerConfigs: [
                hiddenLayer,
                outputLayer
            ]
        };
        let input = [new math_1.Vector([0, 0]), new math_1.Vector([1, 0]), new math_1.Vector([0, 1]), new math_1.Vector([1, 1])];
        let desiredOutput = [new math_1.Vector([0]), new math_1.Vector([1]), new math_1.Vector([1]), new math_1.Vector([0])];
        let net = new net_1.NeuralNet(netConfig);
        for (let i = 0; i < 100000; i++) {
            let error = 0;
            for (let i = 0; i < input.length; i++) {
                let fw = net.forward(input[i]);
                let bw = net.backward(fw, desiredOutput[i]);
                error += net.errors[net.errors.length - 1];
            }
            if (error < 0.01) {
                chai_1.expect(error < 0.01).to.be.true;
                return;
            }
        }
        chai_1.expect(true, "The network did not converge").to.be.false;
    }
};
__decorate([
    mocha_typescript_1.test
], NeuralNetTest.prototype, "testForward", null);
__decorate([
    mocha_typescript_1.test
], NeuralNetTest.prototype, "testBackward", null);
__decorate([
    mocha_typescript_1.test
], NeuralNetTest.prototype, "xOR", null);
NeuralNetTest = __decorate([
    mocha_typescript_1.suite
], NeuralNetTest);
//# sourceMappingURL=neuralnet.js.map