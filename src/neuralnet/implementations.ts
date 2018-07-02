import {NeuralNet, LayerConfig, NetConfig} from './net'
import {MSE, WeightedMSE} from './error'
import {AdalineUnit} from './unit'
import {ActivationFunction, Tanh, Sigmoid, Linear, ReLu} from './activation'
import {Vector} from './math'
import {Optimizer, SGD, SGDNesterovMomentum} from './optimizers';
import { WeightInitializer, TwoLayerInitializer, StaticInitializer, RandomWeightInitializer } from './weightinitializer';

export var hiddenEmulatorLayer: LayerConfig = {
    neuronCount: 100,
    weightInitializer: new RandomWeightInitializer(0.1),
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
    activation: new Tanh()
}

export var outputEmulatorLayer: LayerConfig = {
    neuronCount: 4,
    weightInitializer: new RandomWeightInitializer(0.1),
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
    activation: new Linear()
}

export var emulatorNetConfig: NetConfig = {
    inputs: 5,
    // TODO: was trained with 0.1 then 0.01 after improvement stops => basically decay
    optimizer: /*() => new SGD(0.001),*/ () => new SGDNesterovMomentum(0.0001, 0.9),
    errorFunction: new MSE(),
    layerConfigs: [
        hiddenEmulatorLayer,
        outputEmulatorLayer
    ]
}

export var emulatorNet = new NeuralNet(emulatorNetConfig);

export var hiddenControllerLayer: LayerConfig = {
    neuronCount: 45,
    weightInitializer: new TwoLayerInitializer(0.7, 45),
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
    activation: new Tanh()
}

export var outputControllerLayer: LayerConfig = {
    neuronCount: 1,
    weightInitializer: new RandomWeightInitializer(0.01),
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
    activation: new Tanh() // [-1, 1]
}

export var controllerNetConfig: NetConfig = {
    inputs: 4,
    optimizer: () => new SGD(0.8),
    errorFunction: new MSE(), // ignored
    layerConfigs: [
        hiddenControllerLayer,
        outputControllerLayer
    ]
}

export var controllerNet = new NeuralNet(controllerNetConfig);
