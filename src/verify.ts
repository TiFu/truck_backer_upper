import {NeuralNet, NetConfig} from './neuralnet/net'
import {hiddenEmulatorLayer, outputEmulatorLayer} from './neuralnet/implementations'
import * as fs from 'fs'
import { netInput, outputInput, output } from './verifyConstants'
import {Vector} from './neuralnet/math'
import {TrainTruckController} from './neuralnet/train'
import {World} from './model/world';

let trainTruckController = new TrainTruckController(undefined, undefined, undefined);

let emulator_weights = fs.readFileSync("./emulator_weights").toString();
let parsed_emulator_weights = JSON.parse(emulator_weights);
let outputWeights = [parsed_emulator_weights[1]]

let emulatorOutputNetConfig: NetConfig = {
    inputs: 45,
    learningRate: 0.0001,
    errorFunction: undefined,
    layerConfigs: [
        outputEmulatorLayer
    ]
}

let emulatorOutputNet = new NeuralNet(emulatorOutputNetConfig);
emulatorOutputNet.loadWeights(outputWeights);

let result = emulatorOutputNet.forward(new Vector(outputInput));
let world = new World();

for (let i = 0; i < outputInput.length; i++) {
    let upper = outputInput.slice();
    upper[i] += 10e-6
    let up = emulatorOutputNet.forward(new Vector(upper));
    let upError = trainTruckController.calculateError(up, world.dock);
    let lower = outputInput.slice();
    lower[i] -= 10e-6
    let lo = emulatorOutputNet.forward(new Vector(lower));
    let loError = trainTruckController.calculateError(lo, world.dock);
    
    console.log(i + ": " + (upError - loError) / (2 * 10e-6));
}