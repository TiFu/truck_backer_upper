"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const train_1 = require("./neuralnet/train");
const world_1 = require("./model/world");
const implementations_1 = require("./neuralnet/implementations");
const fs = require("fs");
let world = new world_1.World();
let trainTruckEmulator = new train_1.TrainTruckEmulator(world, implementations_1.emulatorNet);
let savedWeights = fs.readFileSync("./savedWeights").toString();
let parsedWeights = JSON.parse(savedWeights);
trainTruckEmulator.getEmulatorNet().loadWeights(parsedWeights);
let steps = 10000001;
let errorSTep = 10000;
let errorSum = 0;
let epochSteps = 1;
for (let i = 0; i < steps; i++) {
    world.randomize();
    let lastError = trainTruckEmulator.train(epochSteps)[1];
    errorSum += lastError;
    if (i % errorSTep == 0) {
        console.log(errorSum / errorSTep);
        errorSum = 0;
    }
}
fs.writeFileSync("./savedWeights", JSON.stringify(trainTruckEmulator.getEmulatorNet().getWeights()));
//# sourceMappingURL=train.js.map