"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = require("./neuralnet/net");
const implementations_1 = require("./neuralnet/implementations");
const fs = require("fs");
const verifyConstants_1 = require("./verifyConstants");
const math_1 = require("./neuralnet/math");
const train_1 = require("./neuralnet/train");
const world_1 = require("./model/world");
let trainTruckController = new train_1.TrainTruckController(undefined, undefined, undefined);
let emulator_weights = fs.readFileSync("./emulator_weights").toString();
let parsed_emulator_weights = JSON.parse(emulator_weights);
let outputWeights = [parsed_emulator_weights[1]];
let emulatorOutputNetConfig = {
    inputs: 45,
    learningRate: 0.0001,
    weightInitRange: 0.6,
    errorFunction: undefined,
    layerConfigs: [
        implementations_1.outputEmulatorLayer
    ]
};
let emulatorOutputNet = new net_1.NeuralNet(emulatorOutputNetConfig);
emulatorOutputNet.loadWeights(outputWeights);
let result = emulatorOutputNet.forward(new math_1.Vector(verifyConstants_1.outputInput));
let world = new world_1.World();
for (let i = 0; i < verifyConstants_1.outputInput.length; i++) {
    let upper = verifyConstants_1.outputInput.slice();
    upper[i] += 10e-6;
    let up = emulatorOutputNet.forward(new math_1.Vector(upper));
    let upError = trainTruckController.calculateError(up, world.dock);
    let lower = verifyConstants_1.outputInput.slice();
    lower[i] -= 10e-6;
    let lo = emulatorOutputNet.forward(new math_1.Vector(lower));
    let loError = trainTruckController.calculateError(lo, world.dock);
    console.log(i + ": " + (upError - loError) / (2 * 10e-6));
}
//# sourceMappingURL=verify.js.map