import {TrainTruckEmulator, TrainController} from './neuralnet/train'
import {World} from './model/world'
import {simpleEmulatorNet, simpleControllerNet} from './neuralnet/implementations'
import {NetConfig, NeuralNet} from './neuralnet/net';
import * as fs from 'fs';
import {Vector} from './neuralnet/math'
import {Simple} from './model/simple'
import {SimpleControllerError} from './neuralnet/error'
let world = new World();
let simple = new Simple();

//emulatorNet.setDebugMode(true);
//let trainTruckEmulator = new TrainTruckEmulator(world, simpleEmulatorNet);
let simpleControllerError = new SimpleControllerError();
let trainTruckController = new TrainController(world, simple, simpleControllerNet , simpleEmulatorNet, simpleControllerError);

import * as process from 'process'

let alreadyTrainedSteps = Number.parseInt(process.argv[2])

import {createTruckLessons} from './neuralnet/lesson';
import { TruckControllerError } from './neuralnet/error';
let lessons = createTruckLessons(world.truck);

let j = 0;
let lesson = lessons[j];
lesson.maxSteps = 2;
trainTruckController.setLesson(lesson);
let errorAverage = 0;
for (let i = 0; i < lessons[0].samples; i++) {
    let error = trainTruckController.trainSingleStep();
    errorAverage += error;
    if (i % 100 == 0 && i > 0) {
        console.log("[Error] ", errorAverage/100);
        console.log("[Sample] Step " + i + " of " + lesson.samples);
        if (Math.abs(errorAverage) < 10e-7) {
            break;
        }
        errorAverage = 0;
    }
}

console.log("---------------------------------")
console.log("---------------------------------")
console.log("---------------------------------")
console.log("---------------------------------")
console.log("---------------------------------")

console.log("SimpleControllerNet")
console.log(simpleControllerNet.getWeights());

console.log("");
console.log(simple);
simple.x = 2;
let controllerSignal = new Vector([5]);
while (Math.abs(controllerSignal.entries[0]) > 10e-7) {
    controllerSignal = simpleControllerNet.forward(new Vector([simple.x]));
    console.log("[TestState] ", controllerSignal)
    simple.nextState(controllerSignal.entries[0]);
    console.log("[TestState] ", simple.x);
}
