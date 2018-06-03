import * as React from "react"
import * as $ from "jquery"
import {render} from "react-dom"
import Simulation from "./gui/Simulation"
import "bootstrap/dist/css/bootstrap.min.css"

import {NeuralNet, NetConfig, LayerConfig} from './neuralnet/net'
import {MSE} from './neuralnet/error'
import {AdalineUnit} from './neuralnet/unit'
import {ActivationFunction, Tanh} from './neuralnet/activation'
import {Vector} from './neuralnet/math'
import { Car } from "./model/car";
import { Point } from "./math";
import { Dock } from "./model/world";

$(document).ready(() => {
    render(<Simulation object={new Car(new Point(15, 15), 0, [])} dock={new Dock(new Point(0,0))} />, document.getElementById("mainContainer"));
    (window as any).sim = Simulation.instance;
})