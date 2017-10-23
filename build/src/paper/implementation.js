"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = require("../neuralnet/net");
const error_1 = require("../neuralnet/error");
const unit_1 = require("../neuralnet/unit");
const activation_1 = require("../neuralnet/activation");
exports.hiddenEmulatorLayer = {
    neuronCount: 25,
    unitConstructor: (weights, activation, initialWeightRange) => new unit_1.AdalineUnit(weights, activation, initialWeightRange),
    activation: new activation_1.Tanh()
};
exports.outputEmulatorLayer = {
    neuronCount: 4,
    unitConstructor: (weights, activation, initialWeightRange) => new unit_1.AdalineUnit(weights, activation, initialWeightRange),
    activation: new activation_1.Linear()
};
exports.emulatorNetConfig = {
    inputs: 5,
    learningRate: 0.001,
    errorFunction: new error_1.MSE(),
    weightInitRange: 0.01,
    layerConfigs: [
        exports.hiddenEmulatorLayer,
        exports.outputEmulatorLayer
    ]
};
exports.emulatorNet = new net_1.NeuralNet(exports.emulatorNetConfig);
exports.hiddenControllerLayer = {
    neuronCount: 25,
    unitConstructor: (weights, activation, initialWeightRange) => new unit_1.AdalineUnit(weights, activation, initialWeightRange),
    activation: new activation_1.Tanh()
};
exports.outputControllerLayer = {
    neuronCount: 1,
    unitConstructor: (weights, activation, initialWeightRange) => new unit_1.AdalineUnit(weights, activation, initialWeightRange),
    activation: new activation_1.Tanh()
};
exports.controllerNetConfig = {
    inputs: 4,
    learningRate: 0.001,
    weightInitRange: 0.01,
    errorFunction: new error_1.MSE(),
    layerConfigs: [
        exports.hiddenControllerLayer,
        exports.outputControllerLayer
    ]
};
exports.controllerNet = new net_1.NeuralNet(exports.controllerNetConfig);
//# sourceMappingURL=implementation.js.map