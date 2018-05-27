import {TrainTruckEmulator, TrainController} from './neuralnet/train'
import {NormalizedTruck} from './model/truck';
import {World} from './model/world'
import {carControllerNet} from './neuralnet/implementations'
import {NetConfig, NeuralNet} from './neuralnet/net';
import * as fs from 'fs';
import {Vector} from './neuralnet/math'
import {TruckControllerError, CarControllerError} from './neuralnet/error';
import {Point} from './math';
import {CarEmulator, NormalizedCar, Car} from './model/car';

let world = new World();

let emulator_weights = fs.readFileSync("./emulator_weights").toString();
let parsed_emulator_weights = JSON.parse(emulator_weights);
//emulatorNet.setDebugMode(true);
//let trainTruckEmulator = new TrainTruckEmulator(new Normali(world.car), emulatorNet);
//trainTruckEmulator.getEmulatorNet().loadWeights(parsed_emulator_weights);

let normalizedDockPosition = new Point((world.dock.position.x - 50)/ 50, world.dock.position.y / 50);
let errorFunc = new CarControllerError(normalizedDockPosition);
let trainTruckController = new TrainController(world, new NormalizedCar(world.car), carControllerNet , new CarEmulator(world.car), errorFunc);

/*try {
    let parsed_controller_weights = JSON.parse(fs.readFileSync("./controller_weights").toString());
    trainTruckController.getControllerNet().loadWeights(parsed_controller_weights);
} catch(err) {

}*/

import * as process from 'process'

let alreadyTrainedSteps = Number.parseInt(process.argv[2])

import {createTruckLessons} from './neuralnet/lesson';
import { NeuralNetEmulator } from './neuralnet/emulator';
let lessons = createTruckLessons(world.car);

for (let j = 0; j < lessons.length; j++) {
    let lesson = lessons[j];
    trainTruckController.setLesson(lesson);
    console.log("[Info] Next Lesson: " + lesson.no + " : " + JSON.stringify(lesson.getBoundsDescription()))
    for (let i = 0; i < lessons[0].samples; i++) {
        trainTruckController.trainSingleStep();
        if ((i % 100 == 0 && i > 0) || i == lessons[0].samples - 1) {
            console.log("Step " + i + " of " + lesson.samples);
            let averageYError = errorFunc.yError.reduce((prev, next) => prev + next, 0) / errorFunc.yError.length;
            let averageAngleError = errorFunc.angleError.reduce((prev, next) => prev + next, 0) / errorFunc.angleError.length;
            let avgError = errorFunc.errors.reduce((prev, next) => prev + next, 0) / errorFunc.errors.length;
            trainTruckController.emulatorInputs = [];
            errorFunc.errors = [];
            errorFunc.yError = [];
            errorFunc.angleError = [];
            trainTruckController.steeringSignals = [];
            console.log("[Info][AvgError] Lesson: " + lesson.no + ", Step " + i + " of " + lesson.samples + "; Avg error: ", avgError, "Y Distance: " + averageYError + ", Angle: " + averageAngleError / Math.PI *  180)
        }
   }
}