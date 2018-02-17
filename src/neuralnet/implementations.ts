import {NeuralNet, LayerConfig, NetConfig} from './net'
import {MSE, WeightedMSE} from './error'
import {AdalineUnit} from './unit'
import {ActivationFunction, Tanh, Sigmoid, Linear, ReLu} from './activation'
import {Vector} from './math'
import {Optimizer, SGD, SGDNesterovMomentum} from './optimizers';

export var hiddenEmulatorLayer: LayerConfig = {
    neuronCount: 45,
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: number, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
    activation: new Tanh()
}

export var outputEmulatorLayer: LayerConfig = {
    neuronCount: 6,
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: number, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
    activation: new Linear()
}

export var emulatorNetConfig: NetConfig = {
    inputs: 7,
    optimizer: () => new SGDNesterovMomentum(0.1, 0.9),
    errorFunction: new MSE(),
    weightInitRange: 0.3,
    layerConfigs: [
        hiddenEmulatorLayer,
        outputEmulatorLayer
    ]
}

export var emulatorNet = new NeuralNet(emulatorNetConfig);

export var hiddenControllerLayer: LayerConfig = {
    neuronCount: 26,
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: number, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
    activation: new Tanh()
}

export var outputControllerLayer: LayerConfig = {
    neuronCount: 1,
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: number, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
    activation: new Tanh() // [-1, 1]       
}

export var controllerNetConfig: NetConfig = {
    inputs: 6,
    optimizer: () => new SGDNesterovMomentum(0.1,0.9),
    weightInitRange: 0.3,
    errorFunction: new MSE(), // ignored
    layerConfigs: [
        hiddenControllerLayer,
        outputControllerLayer
    ]    
}

export var controllerNet = new NeuralNet(controllerNetConfig);
