import {NeuralNet, LayerConfig, NetConfig} from './net'
import {MSE} from './error'
import {AdalineUnit} from './unit'
import {ActivationFunction, Tanh, Linear} from './activation'
import {Vector} from './math'

export var hiddenEmulatorLayer: LayerConfig = {
    neuronCount: 45,
    unitConstructor: (weights: Vector, activation: ActivationFunction) => new AdalineUnit(weights, activation),
    activation: new Tanh()
}

export var outputEmulatorLayer: LayerConfig = {
    neuronCount: 6,
    unitConstructor: (weights: Vector, activation: ActivationFunction) => new AdalineUnit(weights, activation),
    activation: new Linear()   
}

export var emulatorNetConfig: NetConfig = {
    inputs: 7,
    learningRate: 0.0001,
    errorFunction: new MSE(),
    layerConfigs: [
        hiddenEmulatorLayer,
        outputEmulatorLayer
    ]
}
export var emulatorNet = new NeuralNet(emulatorNetConfig);