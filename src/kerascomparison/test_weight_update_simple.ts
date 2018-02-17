//import {emulatorNet} from '../neuralnet/implementations'
import {Vector} from '../neuralnet/math'
import {NeuralNet, NetConfig, LayerConfig} from '../neuralnet/net';
import {MSE} from '../neuralnet/error';
import {AdalineUnit} from '../neuralnet/unit';
import {ActivationFunction, Linear, Tanh} from '../neuralnet/activation';
import { SGD, Optimizer } from '../neuralnet/optimizers';

export var layer1: LayerConfig = {
    neuronCount: 2,
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: number, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
    activation: new Tanh()
}

export var layer2: LayerConfig = {
    neuronCount: 2,
    unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: number, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
    activation: new Tanh()
}
export var netConfig: NetConfig = {
    inputs: 2,
    optimizer: () => new SGD(0.05),
    errorFunction: new MSE(),
    weightInitRange: 0.3,
    layerConfigs: [
        layer1,
        layer2
    ]
}

let emulatorNet = new NeuralNet(netConfig);
let oldWeights = [
    [
        [
            0.01649947091937065, 
            -0.0020694099366664886, 
            -0.03818223997950554
        ], 
        [
            -0.019388370215892792, 
            0.012062420137226582, 
            -0.017078600823879242
        ]
    ], 
    [
        [
            0.00995566975325346, 
            -0.0403984896838665, 
            -0.016170460730791092
        ], 
        [
            -0.010830570012331009, 
            0.03846506029367447, 
            -0.02988303080201149
        ]
    ]
]



emulatorNet.loadWeights(oldWeights);
console.log("Predict: ", emulatorNet.forward(new Vector([1, 1])))

console.log("A");
let input = new Vector([1,1]);
console.log("Input: " + input.length);
let output = emulatorNet.forward(input)
let expected = new Vector([0.5, 0.25]);
console.log("input der");
console.log(emulatorNet.backward(output, expected, true))

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
input = new Vector([2,2]);
console.log("Input: " + input.length);
output = emulatorNet.forward(input)
expected = new Vector([0.75, 0.375]);
emulatorNet.backward(output, expected, true);

// and first batch (2 items)
emulatorNet.updateWithAccumulatedWeights();

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

console.log("Predict: ", emulatorNet.forward(new Vector([1, 1])))
