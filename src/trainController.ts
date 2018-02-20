import {TrainTruckEmulator, TrainTruckController} from './neuralnet/train'
import {World} from './model/world'
import {emulatorNet, controllerNet, hiddenEmulatorLayer, outputEmulatorLayer} from './neuralnet/implementations'
import {NetConfig, NeuralNet} from './neuralnet/net';
import * as fs from 'fs';
import {Vector} from './neuralnet/math'

let world = new World();

let emulator_weights = fs.readFileSync("./emulator_weights").toString();
let parsed_emulator_weights = JSON.parse(emulator_weights);
//emulatorNet.setDebugMode(true);
let trainTruckEmulator = new TrainTruckEmulator(world, emulatorNet);
trainTruckEmulator.getEmulatorNet().loadWeights(parsed_emulator_weights);


let trainTruckController = new TrainTruckController(world, controllerNet , emulatorNet);
try {
    let parsed_controller_weights = JSON.parse(fs.readFileSync("./controller_weights").toString());
    trainTruckController.getControllerNet().loadWeights(parsed_controller_weights);
} catch(err) {

}
import * as process from 'process'

let alreadyTrainedSteps = Number.parseInt(process.argv[2])

import {lessons} from './neuralnet/lesson';

for (let j = 0; j < lessons.length; j++) {
    let lesson = lessons[j];
    trainTruckController.setLesson(lesson);
    console.log("Next Lesson: ", lesson.no, "Cab Angle: ", "[", lesson.cabAngle.min, ",", lesson.cabAngle.max, "]", "; x: [", lesson.x.min + ", " + lesson.x.max + "]")
    for (let i = 0; i < 10 * lessons[0].samples; i++) {
        trainTruckController.trainSingleStep();
        break;
        if (i % 100 == 0 && i > 0) {
            console.log("Step " + i + " of " + lesson.samples);
            let averageYError = trainTruckController.yError.reduce((prev, next) => prev + next, 0) / trainTruckController.yError.length;
            let averageAngleError = trainTruckController.angleError.reduce((prev, next) => prev + next, 0) / trainTruckController.angleError.length;
            let avgError = trainTruckController.errors.reduce((prev, next) => prev + next, 0) / trainTruckController.errors.length;
            trainTruckController.emulatorInputs = [];
            trainTruckController.errors = [];
            trainTruckController.yError = [];
            trainTruckController.angleError = [];
            trainTruckController.steeringSignals = [];
            console.log("Avg error: ", avgError, "Y Distance: " + averageYError + ", Angle: " + averageYError / Math.PI *  180)
        }
    }
    break;
}