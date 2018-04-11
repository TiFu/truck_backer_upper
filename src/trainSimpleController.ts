import {TrainTruckEmulator, TrainController} from './neuralnet/train'
import {World} from './model/world'
import {simpleEmulatorNet, simpleControllerNet} from './neuralnet/implementations'
import {NetConfig, NeuralNet} from './neuralnet/net';
import * as fs from 'fs';
import {Vector} from './neuralnet/math'
import {Simple} from './model/simple'
let world = new World();
let simple = new Simple();

//emulatorNet.setDebugMode(true);
//let trainTruckEmulator = new TrainTruckEmulator(world, simpleEmulatorNet);

let trainTruckController = new TrainController(world, simple, simpleControllerNet , simpleEmulatorNet, new SimpleControllerError());

import * as process from 'process'

let alreadyTrainedSteps = Number.parseInt(process.argv[2])

import {createTruckLessons} from './neuralnet/lesson';
import { TruckControllerError, SimpleControllerError } from './neuralnet/error';
let lessons = createTruckLessons(world.truck);

let j = 0;
let lesson = lessons[j];
trainTruckController.setLesson(lesson);
for (let i = 0; i < lessons[0].samples; i++) {
    trainTruckController.trainSingleStep();
    if (i % 100 == 0 && i > 0) {
        console.log("Step " + i + " of " + lesson.samples);
    }
}
