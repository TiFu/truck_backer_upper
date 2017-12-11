import {TrainTruckEmulator, TrainTruckController} from './neuralnet/train'
import {World} from './model/world'
import {emulatorNet, controllerNet, hiddenEmulatorLayer, outputEmulatorLayer} from './neuralnet/implementations'
import {NetConfig, NeuralNet} from './neuralnet/net';
import * as fs from 'fs';
import {Vector} from './neuralnet/math'

let sleep = require('sleep');
let world = new World();

let emulator_weights = fs.readFileSync("./emulator_weights").toString();
let parsed_emulator_weights = JSON.parse(emulator_weights);
emulatorNet.setDebugMode(true);
let trainTruckEmulator = new TrainTruckEmulator(world, emulatorNet);
trainTruckEmulator.getEmulatorNet().loadWeights(parsed_emulator_weights);

//let parsed_debug_emulator_weights = 
let trainTruckController = new TrainTruckController(world, controllerNet , emulatorNet);
try {
let parsed_controller_weights = JSON.parse(fs.readFileSync("./controller_weights").toString());
trainTruckController.getControllerNet().loadWeights(parsed_controller_weights);
} catch(err) {

}
import * as process from 'process'

let alreadyTrainedSteps = Number.parseInt(process.argv[2])
for (let i = 0; i < alreadyTrainedSteps; i++) {
    trainTruckController.updateLimitationParameters(true);
}
// train truck simple => only straight driving needed
trainTruckController.setSimple(false);

let steps = 10000001
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

//    console.log(lastError)
    errorSum += lastError;
    //    sleep.sleep(5);
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
//fs.writeFileSync("./controller_weights", JSON.stringify(trainTruckController.getControllerNet().getWeights()));
//console.log(trainTruckEmulator.getEmulatorNet().getWeights())