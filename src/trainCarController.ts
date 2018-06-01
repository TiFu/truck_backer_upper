import {TrainTruckEmulator, TrainController} from './neuralnet/train'
import {NormalizedTruck} from './model/truck';
import {World} from './model/world'
import {carControllerNet, carEmulatorNet} from './neuralnet/implementations'
import {NetConfig, NeuralNet} from './neuralnet/net';
import * as fs from 'fs';
import {Vector} from './neuralnet/math'
import {TruckControllerError, CarControllerError} from './neuralnet/error';
import {Point} from './math';
import {CarEmulator, NormalizedCar, Car} from './model/car';
import * as process from 'process'
import { NeuralNetEmulator } from './neuralnet/emulator';
import {createCarControllerLessons} from './neuralnet/lesson';

let world = new World();

let emulator_weights = fs.readFileSync("./car_emulator_weights").toString();
let parsed_emulator_weights = JSON.parse(emulator_weights);
//emulatorNet.setDebugMode(true);
let trainTruckEmulator = new TrainTruckEmulator(new NormalizedCar(world.car), carEmulatorNet);
trainTruckEmulator.getEmulatorNet().loadWeights(parsed_emulator_weights);

let normalizedDockPosition = new Point((world.dock.position.x - 50)/ 50, world.dock.position.y / 50);
let errorFunc = new CarControllerError(normalizedDockPosition);
let trainTruckController = new TrainController(world, new NormalizedCar(world.car), carControllerNet, new NeuralNetEmulator(carEmulatorNet, new CarEmulator(world.car)), errorFunc);

let lessons = createCarControllerLessons(world.car);

// start at y dist
if (process.argv.length < 3) {
    console.log("Argument starting lesson needed! Pick value between 0 and " + (lessons.length - 1) );
}
let startingLesson = Number.parseInt(process.argv[2]);
console.log("Using starting lesson: " + startingLesson);

if (startingLesson > 0) {
    try {
        console.log("Loading weights from car_emulator_controller_weights_" + (startingLesson - 1));
        let parsed_controller_weights = JSON.parse(fs.readFileSync("./car_emulator_controller_weights_" + (startingLesson - 1)).toString());
        trainTruckController.getControllerNet().loadWeights(parsed_controller_weights);
    } catch(err) {
        console.log(err);
        process.exit();
    }
} else {
    console.log("Starting with random weights");
}


for (let j = startingLesson; j < lessons.length; j++) {
    let lesson = lessons[j];
    trainTruckController.setLesson(lesson);
    carControllerNet.changeOptimizer(lesson.optimizer);

    console.log("[Info] Next Lesson: " + lesson.no + " : " + JSON.stringify(lesson.getBoundsDescription()))
    console.log("Optimizer: " + lesson.optimizer);
    for (let i = startingLesson; i < lessons[j].samples; i++) {
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
   // save lesson weights
   fs.writeFileSync("./car_emulator_controller_weights_" + j, JSON.stringify(carControllerNet.getWeights()));
}