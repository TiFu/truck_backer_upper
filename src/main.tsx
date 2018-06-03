import * as React from "react"
import * as $ from "jquery"
import * as bootstrap from "bootstrap";

// import needed styles
import 'bootstrap/dist/css/bootstrap.css'
import './style.css'
import 'rc-slider/assets/index.css';

import {render} from "react-dom"
import "bootstrap/dist/css/bootstrap.min.css"

import {NeuralNet, NetConfig, LayerConfig} from './neuralnet/net'
import {MSE} from './neuralnet/error'
import {AdalineUnit} from './neuralnet/unit'
import {ActivationFunction, Tanh} from './neuralnet/activation'
import {Vector} from './neuralnet/math'
import { MainComponent } from "./gui/MainComponent";

$(document).ready(() => {
    render(<MainComponent />, document.getElementById("mainContainer"));
})