"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const train_1 = require("./neuralnet/train");
const world_1 = require("./model/world");
const implementations_1 = require("./neuralnet/implementations");
const fs = require("fs");
let sleep = require('sleep');
let world = new world_1.World();
let emulator_weights = fs.readFileSync("./emulator_weights").toString();
let parsed_emulator_weights = JSON.parse(emulator_weights);
implementations_1.emulatorNet.setDebugMode(true);
let trainTruckEmulator = new train_1.TrainTruckEmulator(world, implementations_1.emulatorNet);
trainTruckEmulator.getEmulatorNet().loadWeights(parsed_emulator_weights);
let trainTruckController = new train_1.TrainTruckController(world, implementations_1.controllerNet, implementations_1.emulatorNet);
try {
    let parsed_controller_weights = JSON.parse(fs.readFileSync("./controller_weights").toString());
    trainTruckController.getControllerNet().loadWeights(parsed_controller_weights);
}
catch (err) {
}
const process = require("process");
let alreadyTrainedSteps = Number.parseInt(process.argv[2]);
for (let i = 0; i < alreadyTrainedSteps; i++) {
    trainTruckController.updateLimitationParameters(true);
}
trainTruckController.setSimple(false);
let steps = 10000001;
let errorSTep = 1000;
let errorSum = 0;
let epochSteps = 1;
for (let i = 0; i < steps; i++) {
    trainTruckController.prepareTruckPosition();
    let lastError = trainTruckController.train(1);
    if (isNaN(lastError)) {
        i--;
        continue;
    }
    errorSum += lastError;
    if (i > 0 && i % errorSTep == 0) {
        console.log(i + ": " + errorSum);
        console.log(trainTruckController.limitationSteps);
        if (i % 10000 == 0) {
            trainTruckController.getControllerNet().decreaseLearningRate(-0.3);
        }
        errorSum = 0;
    }
    if (i % 10000 == 0 && i > 0) {
        console.log("Saved weights after " + i + " iterations.");
        fs.writeFileSync("./controller_weights", JSON.stringify(trainTruckController.getControllerNet().getWeights()));
    }
}
//# sourceMappingURL=trainController.js.map