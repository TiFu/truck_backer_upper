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

$(document).ready(() => {
    render(<Simulation />, document.getElementById("mainContainer"));
    (window as any).sim = Simulation.instance;
})