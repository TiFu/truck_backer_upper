"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const train_1 = require("./neuralnet/train");
const world_1 = require("./model/world");
const implementations_1 = require("./neuralnet/implementations");
const fs = require("fs");
let world = new world_1.World();
let trainTruckEmulator = new train_1.TrainTruckEmulator(world, implementations_1.emulatorNet);
try {
    let savedWeights = fs.readFileSync("./emulator_weights").toString();
    let parsedWeights = JSON.parse(savedWeights);
    trainTruckEmulator.getEmulatorNet().loadWeights(parsedWeights);
}
catch (err) {
}
let steps = 10000001;
let errorSTep = 10000;
let errorSum = 0;
let errorMax = 0;
let epochSteps = 1;
let highErrors = 0;
for (let i = 0; i < steps; i++) {
    world.randomize();
    let lastError = trainTruckEmulator.train(epochSteps)[1];
    errorSum += lastError;
    errorMax = Math.max(errorMax, lastError);
    if (lastError > 1) {
        highErrors++;
    }
    if (i > 0 && i % errorSTep == 0) {
        console.log(i + ": " + errorSum + " / " + errorMax + " / " + highErrors);
        fs.writeFileSync("./emulator_weights", JSON.stringify(trainTruckEmulator.getEmulatorNet().getWeights()));
        errorSum = 0;
        highErrors = 0;
        errorMax = 0;
    }
}
fs.writeFileSync("./emulator_weights", JSON.stringify(trainTruckEmulator.getEmulatorNet().getWeights()));
//# sourceMappingURL=trainEmulator.js.map