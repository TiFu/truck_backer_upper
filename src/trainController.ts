import {TrainTruckEmulator, TrainTruckController} from './neuralnet/train'
import {World} from './model/world'
import {emulatorNet, controllerNet} from './neuralnet/implementations'
import * as fs from 'fs';

let world = new World();

let emulator_weights = fs.readFileSync("./emulator_weights").toString();
let parsed_emulator_weights = JSON.parse(emulator_weights);
let parsed_controller_weights = JSON.parse(fs.readFileSync("./controller_weights").toString());

let trainTruckEmulator = new TrainTruckEmulator(world, emulatorNet);
trainTruckEmulator.getEmulatorNet().loadWeights(parsed_emulator_weights);

let trainTruckController = new TrainTruckController(world, controllerNet , emulatorNet);
trainTruckController.getControllerNet().loadWeights(parsed_controller_weights);

let steps = 10000001
let errorSTep = 200;
let errorSum = 0;
let epochSteps = 1;
for (let i = 0; i < steps; i++) {
    trainTruckController.prepareTruckPosition();
    let lastError = trainTruckController.train(1);
    errorSum += lastError;
    if (i % errorSTep == 0) {
        console.log(i + ": " + errorSum / errorSTep);
        errorSum = 0;
    }
    if (i % 10000 == 0 && i > 0) {
        console.log("Saved weights after " + i + " iterations.");
        fs.writeFileSync("./controller_weights", JSON.stringify(trainTruckController.getControllerNet().getWeights()));        
    }
}

fs.writeFileSync("./controller_weights", JSON.stringify(trainTruckController.getControllerNet().getWeights()));
//console.log(trainTruckEmulator.getEmulatorNet().getWeights())