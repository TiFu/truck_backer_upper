import {TrainTruckEmulator, TrainController} from './neuralnet/train'
import {NormalizedTruck} from './model/truck';
import {World} from './model/world'
import {emulatorNet, controllerNet, hiddenEmulatorLayer, outputEmulatorLayer} from './neuralnet/implementations'
import {NetConfig, NeuralNet} from './neuralnet/net';
import * as fs from 'fs';
import {Vector} from './neuralnet/math'
import {TruckControllerError} from './neuralnet/error';
import {Point} from './math';
let world = new World();

let emulator_weights = fs.readFileSync("./emulator_weights").toString();
let parsed_emulator_weights = JSON.parse(emulator_weights);
//emulatorNet.setDebugMode(true);
let trainTruckEmulator = new TrainTruckEmulator(new NormalizedTruck(world.truck), emulatorNet);
trainTruckEmulator.getEmulatorNet().loadWeights(parsed_emulator_weights);

let normalizedDockPosition = new Point((world.dock.position.x - 50)/ 50, world.dock.position.y / 50);
let errorFunc = new TruckControllerError(normalizedDockPosition);
let trainTruckController = new TrainController(world, new NormalizedTruck(world.truck), controllerNet , emulatorNet, errorFunc);

try {
    let parsed_controller_weights = JSON.parse(fs.readFileSync("./controller_weights").toString());
    trainTruckController.getControllerNet().loadWeights(parsed_controller_weights);
} catch(err) {

}

import * as process from 'process'

let alreadyTrainedSteps = Number.parseInt(process.argv[2])

import {createTruckLessons} from './neuralnet/lesson';
let lessons = createTruckLessons(world.truck);

for (let j = 0; j < lessons.length; j++) {
    let lesson = lessons[j];
    trainTruckController.setLesson(lesson);
    console.log("Next Lesson: ", lesson.no, "Cab Angle: ", "[", lesson.cabAngle.min * 180 / Math.PI, ",", lesson.cabAngle.max * 180 / Math.PI, "]", "; x: [", lesson.x.min + ", " + lesson.x.max + "]")
    for (let i = 0; i < lessons[0].samples; i++) {
        trainTruckController.trainSingleStep();
        if (i % 100 == 0 && i > 0) {
            console.log("Step " + i + " of " + lesson.samples);
            let averageYError = errorFunc.yError.reduce((prev, next) => prev + next, 0) / errorFunc.yError.length;
            let averageAngleError = errorFunc.angleError.reduce((prev, next) => prev + next, 0) / errorFunc.angleError.length;
            let avgError = errorFunc.errors.reduce((prev, next) => prev + next, 0) / errorFunc.errors.length;
            trainTruckController.emulatorInputs = [];
            errorFunc.errors = [];
            errorFunc.yError = [];
            errorFunc.angleError = [];
            trainTruckController.steeringSignals = [];
            console.log("[AvgError] Avg error: ", avgError, "Y Distance: " + averageYError + ", Angle: " + averageAngleError / Math.PI *  180)
        }
   }
   break;
}