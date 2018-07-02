import {TrainTruckEmulator} from './../neuralnet/train'
import {World, Dock} from './../model/world'
import {carEmulatorNet} from './../neuralnet/implementations'
import * as fs from 'fs';
import {Point} from './../math';
import {NormalizedTruck} from './../model/truck';
import { NormalizedCar, Car } from './../model/car';
let car = new Car(new Point(15, 15), 0, []);
let dock = new Dock(new Point(0, 0));

let world = new World(car, dock);
let trainTruckEmulator = new TrainTruckEmulator(new NormalizedCar(car), carEmulatorNet, 1);

try {
    let savedWeights = fs.readFileSync("./../weights/car_emulator_weights").toString();
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
    car.randomizeNoLimits();
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
        console.log("[AvgError]", i + ": Avg Error " + errorSum/summedSteps + " / Max " + errorMax + " / High " + highErrors);
        console.log("")
        fs.writeFileSync("./../weights/car_emulator_weights", JSON.stringify(trainTruckEmulator.getEmulatorNet().getWeights()));
        let cabAngle = trainTruckEmulator.cabAngleError.reduce((prev: number, next: number) => prev + next, 0) / trainTruckEmulator.cabAngleError.length;            
        let xCab = trainTruckEmulator.xCabError.reduce((prev: number, next: number) => prev + next, 0) / trainTruckEmulator.xCabError.length
        let yCab = trainTruckEmulator.yCabError.reduce((prev: number, next: number) => prev + next, 0) / trainTruckEmulator.yCabError.length

        console.log("[Cab Angle Error] ", cabAngle);
        console.log("[x cab] ", xCab);
        console.log("[y cab] ", yCab);

        errorSum = 0;
        summedSteps = 0;
        highErrors = 0;
        errorMax = 0;
        highErrors = 0;
    }
}

fs.writeFileSync("./../weights/car_emulator_weights", JSON.stringify(trainTruckEmulator.getEmulatorNet().getWeights()));
//console.log(trainTruckEmulator.getEmulatorNet().getWeights())