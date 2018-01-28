//import {emulatorNet} from '../neuralnet/implementations'
import {Vector} from '../neuralnet/math'
import {NeuralNet, NetConfig, LayerConfig} from '../neuralnet/net';
import {MSE} from '../neuralnet/error';
import {AdalineUnit} from '../neuralnet/unit';
import {ActivationFunction, Linear, Tanh} from '../neuralnet/activation';

export var layer: LayerConfig = {
    neuronCount: 1,
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: number) => new AdalineUnit(weights, activation, initialWeightRange),
    activation: new Tanh()
}
export var netConfig: NetConfig = {
    inputs: 2,
    learningRate: 0.001,
    errorFunction: new MSE(),
    weightInitRange: 0.3,
    layerConfigs: [
        layer
    ]
}

let emulatorNet = new NeuralNet(netConfig);
let oldWeights = [
    [
        [
            0.023342039436101913,
            0.0045457, 
            -0.004192470107227564, 
        ]
    ]
]

emulatorNet.loadWeights(oldWeights);
console.log("Predict: ", emulatorNet.forward(new Vector([1, 1])))

console.log("A");
let input = new Vector([1,1]);
console.log("Input: " + input.length);
let output = emulatorNet.forward(input)
let expected = new Vector([2]);
console.log("input der");
console.log(emulatorNet.backward(output, expected))

let newWeights = JSON.parse(JSON.stringify(emulatorNet.getWeights()));

let diff = [];
for (let i = 0; i < newWeights.length; i++) {
    let iArr = [];
    let iWeights = newWeights[i];
    for (let j = 0; j < iWeights.length; j++) {
        let jWeights = iWeights[j]
        let jArr = [];
        for (let k = 0; k < jWeights.length; k++) {
            jArr.push(jWeights[k] - oldWeights[i][j][k]);
        }
        iArr.push(jArr);
    }
    diff.push(iArr);
}
console.log(diff);


console.log("Predict: ", emulatorNet.forward(new Vector([1, 1])))
// and again
input = new Vector([1,1]);
console.log("Input: " + input.length);
output = emulatorNet.forward(input)
expected = new Vector([2]);
emulatorNet.backward(output, expected);

let newWeights2 = emulatorNet.getWeights();

diff = [];
for (let i = 0; i < newWeights2.length; i++) {
    let iArr = [];
    let iWeights = newWeights2[i];
    for (let j = 0; j < iWeights.length; j++) {
        let jWeights = iWeights[j]
        let jArr = [];
        for (let k = 0; k < jWeights.length; k++) {
            jArr.push(jWeights[k] - newWeights[i][j][k]);
        }
        iArr.push(jArr);
    }
    diff.push(iArr);
}
console.log("Diff")
console.log(diff);