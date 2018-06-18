import {TrainTruckEmulator, TrainController} from './neuralnet/train'
import {World, Dock} from './model/world'
import {controllerNet, emulatorNet} from './neuralnet/implementations'
import {NetConfig, NeuralNet} from './neuralnet/net';
import * as fs from 'fs';
import {Vector} from './neuralnet/math'
import {TruckControllerError} from './neuralnet/error';
import {Point} from './math';
import {Truck, NormalizedTruck} from './model/truck';
import * as process from 'process'
import { NeuralNetEmulator } from './neuralnet/emulator';
import {createTruckControllerLessons} from './neuralnet/lesson';

let dock = new Dock(new Point(0, 0));
let truck = new Truck(new Point(15, 15), 0, 0, dock, []);

let world = new World(truck, dock);

let emulator_weights = fs.readFileSync("./weights/truck_emulator_weights").toString();
let parsed_emulator_weights = JSON.parse(emulator_weights);
//emulatorNet.setDebugMode(true);
//let trainTruckEmulator = new TrainTruckEmulator(new NormalizedTruck(truck), emulatorNet);
emulatorNet.loadWeights(parsed_emulator_weights);

let normalizedDockPosition = new Point((world.dock.position.x - 50)/ 50, world.dock.position.y / 50);
let errorFunc = new TruckControllerError(normalizedDockPosition);
let trainTruckController = new TrainController(world, new NormalizedTruck(truck), controllerNet, new NeuralNetEmulator(emulatorNet), errorFunc);

let lessons = createTruckControllerLessons(truck);

// start at y dist
if (process.argv.length < 3) {
    console.log("Argument starting lesson needed! Pick value between 0 and " + (lessons.length - 1) );
}
let startingLesson = Number.parseInt(process.argv[2]);
console.log("Using starting lesson: " + startingLesson);

if (startingLesson > 0) {
    try {
        console.log("Loading weights from truck_emulator_controller_weights_" + (startingLesson - 1));
        let parsed_controller_weights = JSON.parse(fs.readFileSync("./weights/truck_emulator_controller_weights_" + (startingLesson - 1)).toString());
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
    controllerNet.changeOptimizer(lesson.optimizer);

    console.log("Optimizer: " + lesson.optimizer)
    ;
    console.log("Max Steps: " + lesson.maxSteps);
    for (let i = 0; i < lessons[j].samples; i++) {
  //      console.log("Step: ", i)
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
//        if (i == 100)
 //           process.exit();
   }
   // save lesson weights
   fs.writeFileSync("./weights/truck_emulator_controller_weights_" + j, JSON.stringify(controllerNet.getWeights()));
}