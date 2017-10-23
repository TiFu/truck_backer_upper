import {NeuralNet, LayerConfig, NetConfig} from '../neuralnet/net'
import {MSE} from '../neuralnet/error'
import {AdalineUnit} from '../neuralnet/unit'
import {ActivationFunction, Tanh, Sigmoid, Linear, ReLu} from '../neuralnet/activation'
import {Vector} from '../neuralnet/math'

export var hiddenEmulatorLayer: LayerConfig = {
    neuronCount: 25,
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: number) => new AdalineUnit(weights, activation, initialWeightRange),
    activation: new Tanh()
}

export var outputEmulatorLayer: LayerConfig = {
    neuronCount: 4,
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: number) => new AdalineUnit(weights, activation, initialWeightRange),
    activation: new Linear()
}

export var emulatorNetConfig: NetConfig = {
    inputs: 5,
    learningRate: 0.001,
    errorFunction: new MSE(),
    weightInitRange: 0.01,
    layerConfigs: [
        hiddenEmulatorLayer,
        outputEmulatorLayer
    ]
}

export var emulatorNet = new NeuralNet(emulatorNetConfig);

export var hiddenControllerLayer: LayerConfig = {
    neuronCount: 25,
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: number) => new AdalineUnit(weights, activation, initialWeightRange),
    activation: new Tanh()
}

export var outputControllerLayer: LayerConfig = {
    neuronCount: 1,
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: number) => new AdalineUnit(weights, activation, initialWeightRange),
    activation: new Tanh() // [-1, 1]       
}

export var controllerNetConfig: NetConfig = {
    inputs: 4,
    learningRate: 0.001,
    weightInitRange: 0.01,
    errorFunction: new MSE(), // ignored
    layerConfigs: [
        hiddenControllerLayer,
        outputControllerLayer
    ]    
}

export var controllerNet = new NeuralNet(controllerNetConfig);
