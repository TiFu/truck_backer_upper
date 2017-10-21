import {TrainTruckEmulator} from './neuralnet/train'
import {World} from './model/world'
import {emulatorNet} from './neuralnet/implementations'
import * as fs from 'fs';

let world = new World();
let trainTruckEmulator = new TrainTruckEmulator(world, emulatorNet);

try {
let savedWeights = fs.readFileSync("./emulator_weights").toString();
let parsedWeights = JSON.parse(savedWeights);
trainTruckEmulator.getEmulatorNet().loadWeights(parsedWeights);
} catch(err) {
    
}
let steps = 10000001
let errorSTep = 10000;
let errorSum = 0;
let errorMax = 0;
let epochSteps = 1;
for (let i = 0; i < steps; i++) {
//    console.log(i + " of " + steps);
    world.randomize();
    let lastError = trainTruckEmulator.train(epochSteps)[1];
    errorSum += lastError;
    errorMax = Math.max(errorMax, lastError);
    if (i % errorSTep == 0) {
        console.log(i + ": " + errorSum / errorSTep + " / " + errorMax);
        fs.writeFileSync("./emulator_weights", JSON.stringify(trainTruckEmulator.getEmulatorNet().getWeights()));
        errorSum = 0;
        errorMax = 0;
    }
}

fs.writeFileSync("./emulator_weights", JSON.stringify(trainTruckEmulator.getEmulatorNet().getWeights()));
//console.log(trainTruckEmulator.getEmulatorNet().getWeights())