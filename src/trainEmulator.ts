import {TrainTruckEmulator} from './neuralnet/train'
import {World} from './model/world'
import {emulatorNet} from './neuralnet/implementations'
import * as fs from 'fs';
import {NormalizedTruck} from './model/truck';

let world = new World();
let trainTruckEmulator = new TrainTruckEmulator(new NormalizedTruck(world.truck), emulatorNet, 1);

try {
    let savedWeights = fs.readFileSync("./emulator_weights").toString();
    let parsedWeights = JSON.parse(savedWeights);
    trainTruckEmulator.getEmulatorNet().loadWeights(parsedWeights);
} catch(err) {

}
let dumps = 0;

let steps = 10000001
let errorSTep = 1000;
let errorSum = 0;
let errorMax = 0;
let epochSteps = 1;
let highErrors = 0;
let summedSteps = 0;
for (let i = 0; i < steps; i++) {
//    console.log(i + " of " + steps);
    world.truck.randomizeNoLimits();
    let lastError2 = trainTruckEmulator.train(epochSteps);
    let lastError = lastError2[1];
//    console.log("lastError", lastError);
    if (lastError > 0.2) {
        highErrors++;
    }
    errorSum += lastError;
    summedSteps++;
    errorMax = Math.max(errorMax, lastError);
    if ((i > 0 || errorSTep == 1) && i % errorSTep == 0) {
        let cabAngle = trainTruckEmulator.cabAngleError.reduce((prev: number, next: number) => prev + next, 0) / trainTruckEmulator.cabAngleError.length;            
        let trailerAngle = trainTruckEmulator.trailerAngleError.reduce((prev: number, next: number) => prev + next, 0) / trainTruckEmulator.trailerAngleError.length;            
        let xCab = trainTruckEmulator.xCabError.reduce((prev: number, next: number) => prev + next, 0) / trainTruckEmulator.xCabError.length
        let yCab = trainTruckEmulator.yCabError.reduce((prev: number, next: number) => prev + next, 0) / trainTruckEmulator.yCabError.length
        let yTrailer = trainTruckEmulator.yTrailerError.reduce((prev: number, next: number) => prev + next, 0) / trainTruckEmulator.yTrailerError.length
        let xTrailer = trainTruckEmulator.xTrailerError.reduce((prev: number, next: number) => prev + next, 0) / trainTruckEmulator.xTrailerError.length

        console.log("[Cab Angle Error] ", cabAngle);
        console.log("[Trailer Angle] ", trailerAngle);
        console.log("[x cab] ", xCab);
        console.log("[y cab] ", yCab);
        console.log("[y trailer]", yTrailer);
        console.log("[x trailer]", xTrailer);

        trainTruckEmulator.cabAngleError = [];
        trainTruckEmulator.trailerAngleError = [];
        trainTruckEmulator.xCabError = [];
        trainTruckEmulator.yCabError = [];
        trainTruckEmulator.yTrailerError = [];
        trainTruckEmulator.xTrailerError = [];
        
        console.log("[AvgError]", i + ": Avg Error " + errorSum/summedSteps + " / Max " + errorMax + " / High " + highErrors);
        console.log("[AvgErrorComp]", "Cab Angle: " + cabAngle + " / Trailer Angle: " + trailerAngle + " / xCab: " + xCab + " / yCab: " + yCab + " / xTrailer: " + xTrailer + " / yTrailer: " + yTrailer);
        console.log("")
        fs.writeFileSync("./emulator_weights", JSON.stringify(trainTruckEmulator.getEmulatorNet().getWeights()));
        errorSum = 0;
        summedSteps = 0;
        highErrors = 0;
        errorMax = 0;
        highErrors = 0;
    }
}

fs.writeFileSync("./emulator_weights", JSON.stringify(trainTruckEmulator.getEmulatorNet().getWeights()));
//console.log(trainTruckEmulator.getEmulatorNet().getWeights())