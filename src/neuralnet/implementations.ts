import {NeuralNet, LayerConfig, NetConfig} from './net'
import {MSE, WeightedMSE} from './error'
import {AdalineUnit} from './unit'
import {ActivationFunction, Tanh, Sigmoid, Linear, ReLu} from './activation'
import {Vector} from './math'
import {Optimizer, SGD, SGDNesterovMomentum} from './optimizers';
import { WeightInitializer, TwoLayerInitializer, StaticInitializer, RandomWeightInitializer } from './weightinitializer';

export var hiddenEmulatorLayer: LayerConfig = {
    neuronCount: 45,
    weightInitializer: TwoLayerInitializer(0.7, 45),
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
    activation: new Tanh()
}

export var outputEmulatorLayer: LayerConfig = {
    neuronCount: 6,
    weightInitializer: TwoLayerInitializer(0.7, 6),
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
    activation: new Linear()
}

export var emulatorNetConfig: NetConfig = {
    inputs: 7,
    // TODO: was trained with 0.1 then 0.01 after improvement stops => basically decay
    optimizer: () => new SGD(0.01), //new SGDNesterovMomentum(0.1, 0.9),
    errorFunction: new MSE(),
    layerConfigs: [
        hiddenEmulatorLayer,
        outputEmulatorLayer
    ]
}

export var emulatorNet = new NeuralNet(emulatorNetConfig);

var simpleEmulatorLayer: LayerConfig = {
    neuronCount: 1,
    weightInitializer: StaticInitializer([1.02, 0.98, 0.1]), // we're off by 0.1
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
    activation: new Tanh()
}

export var simpleEmulatorNetConfig: NetConfig = {
    inputs: 2,
    optimizer: () => new SGDNesterovMomentum(0.1, 0.9),
    errorFunction: new MSE(),
    layerConfigs: [
        simpleEmulatorLayer
    ]
}

export var simpleEmulatorNet = new NeuralNet(simpleEmulatorNetConfig);

export var hiddenControllerLayer: LayerConfig = {
    neuronCount: 26,
    weightInitializer: TwoLayerInitializer(0.7, 26),
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
    activation: new Tanh()
}

export var outputControllerLayer: LayerConfig = {
    neuronCount: 1,
    weightInitializer: TwoLayerInitializer(0.7, 1),
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
    activation: new Tanh() // [-1, 1]
}

export var controllerNetConfig: NetConfig = {
    inputs: 6,
    optimizer: () => new SGD(0.8),
    errorFunction: new MSE(), // ignored
    layerConfigs: [
        hiddenControllerLayer,
        outputControllerLayer
    ]
}

export var controllerNet = new NeuralNet(controllerNetConfig);

export var hiddenSimpleControllerLayer: LayerConfig = {
    neuronCount: 3,
    weightInitializer: StaticInitializer([0.1, -0.1]),
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
    activation: new Tanh()
}

export var outputSimpleControllerLayer: LayerConfig = {
    neuronCount: 1,
    weightInitializer: StaticInitializer([0.3, -0.1, 0.25, -0.15]),
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
    activation: new Tanh() // [-1, 1]
}

export var simpleControllerNetConfig: NetConfig = {
    inputs: 1,
    optimizer: () => new SGD(0.2),
    errorFunction: new MSE(), // ignored
    layerConfigs: [
        hiddenSimpleControllerLayer,
        outputSimpleControllerLayer
    ]
}

export var simpleControllerNet = new NeuralNet(simpleControllerNetConfig);


// Car


export var hiddenCarControllerLayer: LayerConfig = {
    neuronCount: 26,
    weightInitializer: RandomWeightInitializer(0.01),
//    weightInitializer: TwoLayerInitializer(0.7, 26),
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
    activation: new Tanh()
}

export var outputCarControllerLayer: LayerConfig = {
    neuronCount: 1,
    weightInitializer: RandomWeightInitializer(0.01),
//    weightInitializer: TwoLayerInitializer(0.7, 1),
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
    activation: new Tanh() // [-1, 1]
}

export var carControllerNetConfig: NetConfig = {
    inputs: 3,
    optimizer: () => new SGD(0.1),
    errorFunction: new MSE(), // ignored
    layerConfigs: [
        hiddenCarControllerLayer,
        outputCarControllerLayer
    ]
}

export var carControllerNet = new NeuralNet(carControllerNetConfig);