import * as React from "react"
import * as $ from "jquery"
import {render} from "react-dom"
import Simulation from "./Simulation"
import "bootstrap/dist/css/bootstrap.min.css"

import {NeuralNet, NetConfig, LayerConfig} from './neuralnet/net'
import {MSE} from './neuralnet/error'
import {AdalineUnit} from './neuralnet/unit'
import {ActivationFunction, Tanh} from './neuralnet/activation'
import {Vector} from './neuralnet/math'

class NeuralNetTest {
    private net: NeuralNet;

    constructor() {
        let layer1: LayerConfig = {
            neuronCount: 1,
            unitConstructor: (weights: Vector, activation: ActivationFunction) => new AdalineUnit(weights, activation),
            activation: new Tanh()            
        }

/*        let layer2: LayerConfig = {
            neuronCount: 1,
            unitConstructor: (weights: Vector, activation: ActivationFunction) => new AdalineUnit(weights, activation),
            activation: new Tanh()            
        }*/

        let netConfig: NetConfig = {
            inputs: 2,
            learningRate: 1,
            errorFunction: new MSE(),
            layerConfigs: [
                layer1,
            ]
        }
        this.net = new NeuralNet(netConfig);
    }

    public forward(a: number, b: number) {
        let vec = new Vector([a, b]);
        return this.net.forward(vec);
    }

    public backward(output: Vector, expected: number) {
        return this.net.backward(output, new Vector([expected]));
    }
}

$(document).ready(() => {
    render(<Simulation />, document.getElementById("mainContainer"));
    (window as any).sim = Simulation.instance;
    (window as any).nnTest = new NeuralNetTest();
})