"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const $ = require("jquery");
const react_dom_1 = require("react-dom");
const Simulation_1 = require("./Simulation");
require("bootstrap/dist/css/bootstrap.min.css");
const net_1 = require("./neuralnet/net");
const error_1 = require("./neuralnet/error");
const unit_1 = require("./neuralnet/unit");
const activation_1 = require("./neuralnet/activation");
const math_1 = require("./neuralnet/math");
class NeuralNetTest {
    constructor() {
        let layer1 = {
            neuronCount: 1,
            unitConstructor: (weights, activation) => new unit_1.AdalineUnit(weights, activation),
            activation: new activation_1.Tanh()
        };
        let netConfig = {
            inputs: 2,
            learningRate: 1,
            errorFunction: new error_1.MSE(),
            layerConfigs: [
                layer1,
            ]
        };
        this.net = new net_1.NeuralNet(netConfig);
    }
    forward(a, b) {
        let vec = new math_1.Vector([a, b]);
        return this.net.forward(vec);
    }
    backward(output, expected) {
        return this.net.backward(output, new math_1.Vector([expected]));
    }
}
$(document).ready(() => {
    react_dom_1.render(React.createElement(Simulation_1.default, null), document.getElementById("mainContainer"));
    window.sim = Simulation_1.default.instance;
    window.nnTest = new NeuralNetTest();
});
//# sourceMappingURL=main.js.map