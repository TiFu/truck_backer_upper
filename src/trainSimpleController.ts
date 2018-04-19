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
lesson.maxSteps = 3;
trainTruckController.setLesson(lesson);
for (let i = 0; i < lessons[0].samples; i++) {
    let error = trainTruckController.trainSingleStep();
    console.error("[Error] ", i, error);
    if (Math.abs(error) < 10e-7) {
        break;
    }
    if (i % 100 == 0 && i > 0) {
        console.log("Step " + i + " of " + lesson.samples);
    }
}

console.error(simpleControllerNet.getWeights());