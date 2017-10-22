"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const world_1 = require("../model/world");
const math_1 = require("../math");
const math_2 = require("../neuralnet/math");
const assert = require("assert");
const implementation_1 = require("./implementation");
class ControllerTrainer {
    constructor(emulatorNet, controllerNet, lessons, world) {
        this.emulatorNet = emulatorNet;
        this.controllerNet = controllerNet;
        this.lessons = lessons;
        this.world = world;
        this.tep1 = new math_1.Point(-10, 30);
        this.tep2 = new math_1.Point(80, -30);
    }
    train() {
        this.emulatorNet.fixWeights(true);
        for (let lesson of this.lessons) {
            let errorSum = this.trainLesson(lesson);
            console.log("Lesson " + lesson.getName() + ":  " + errorSum);
        }
        this.emulatorNet.fixWeights(false);
    }
    trainLesson(lesson) {
        let errorSum = 0;
        for (let i = 0; i < lesson.getNumberOfTrials(); i++) {
            this.world.randomizeMax2(lesson.getTep1(), lesson.getTep2(), lesson.getMaxAngle(), lesson.getAngleType());
            this.trainStep(lesson.getMaxSteps());
            errorSum = 0;
            if (i % 500 == 0) {
                for (let z = 0; z < 1000; z++) {
                    this.world.randomizeMax2(lesson.getTep1(), lesson.getTep2(), lesson.getMaxAngle(), lesson.getAngleType());
                    this.forwardPass(lesson.getMaxSteps());
                    let finalState = this.getEmulatorState(this.world.truck.getStateVector());
                    errorSum += this.getError(finalState, this.world.dock);
                    this.controllerNet.clearInputs();
                    this.emulatorNet.clearInputs();
                }
                console.log("Error Sum: " + errorSum);
            }
        }
        errorSum = 0;
        for (let i = 0; i < 100; i++) {
            this.world.randomizeMax2(lesson.getTep1(), lesson.getTep2(), lesson.getMaxAngle(), lesson.getAngleType());
            this.forwardPass(lesson.getMaxSteps());
            let finalState = this.getEmulatorState(this.world.truck.getStateVector());
            errorSum += this.getError(finalState, this.world.dock);
            this.controllerNet.clearInputs();
            this.emulatorNet.clearInputs();
        }
        return errorSum;
    }
    standardize(ret) {
        ret.entries[0] /= Math.PI;
        ret.entries[1] -= this.tep1.x;
        ret.entries[1] /= this.tep2.x - this.tep1.x;
        ret.entries[2] -= this.tep1.y;
        ret.entries[2] /= this.tep2.y - this.tep1.y;
        ret.entries[3] /= Math.PI;
        if (ret.length == 6) {
            ret.entries[4] -= this.tep1.x;
            ret.entries[4] /= this.tep2.x - this.tep1.x;
            ret.entries[5] -= this.tep1.y;
            ret.entries[5] /= this.tep2.y - this.tep1.y;
        }
    }
    getControllerState(state) {
        let arr = state.entries.slice(2, state.entries.length);
        arr.push(this.world.dock.position.x);
        arr.push(this.world.dock.position.y);
        let ret = new math_2.Vector(arr);
        return ret;
    }
    getEmulatorState(state) {
        let arr = state.entries.slice(2, state.entries.length);
        let ret = new math_2.Vector(arr);
        return ret;
    }
    forwardPass(maxSteps) {
        let canContinue = true;
        let i = 0;
        while (canContinue && i < maxSteps) {
            let controllerState = this.getControllerState(this.world.truck.getStateVector());
            this.standardize(controllerState);
            let emulatorState = this.getEmulatorState(this.world.truck.getStateVector());
            this.standardize(emulatorState);
            let controllerNetOutput = this.controllerNet.forward(controllerState);
            let steeringSignal = controllerNetOutput.entries[0];
            assert(controllerNetOutput.length == 1, "Controller Net should have only 1 output");
            emulatorState = emulatorState.getWithNewElement(steeringSignal);
            let nextEmulatorState = this.emulatorNet.forward(emulatorState);
            canContinue = this.world.nextTimeStep(steeringSignal);
            i++;
        }
        return i;
    }
    trainStep(maxSteps) {
        let i = this.forwardPass(maxSteps);
        let finalState = this.getEmulatorState(this.world.truck.getStateVector());
        let errorDerivative = this.getErorrDerivative(finalState, this.world.dock);
        let error = this.getError(finalState, this.world.dock);
        while (i > 0) {
            let emulatorDerivative = this.emulatorNet.backwardWithGradient(errorDerivative, false);
            assert(emulatorDerivative.length == 5, "Incorrect emulator derivative length");
            let steeringSignalDerivative = emulatorDerivative.entries[4];
            let controllerBackwardInput = new math_2.Vector([steeringSignalDerivative]);
            let controllerDerivative = this.controllerNet.backwardWithGradient(controllerBackwardInput, true);
            assert(controllerDerivative.length == 6, "Incorrect Contrller Derivative length");
            errorDerivative = new math_2.Vector(controllerDerivative.entries.slice(0, 4));
            assert(errorDerivative.length == 4);
            i--;
        }
        this.controllerNet.updateWithAccumulatedWeights();
        return error;
    }
    getError(emulatorState, dock) {
        let xError = dock.position.x - Math.max(emulatorState.entries[1], 0);
        let yError = dock.position.y - emulatorState.entries[2];
        let thetaError = 0 - emulatorState.entries[3];
        return xError * xError + yError * yError + thetaError * thetaError;
    }
    getErorrDerivative(emulatorState, dock) {
        let xError = dock.position.x - Math.max(emulatorState.entries[1], 0);
        let yError = dock.position.y - emulatorState.entries[2];
        let thetaError = 0 - emulatorState.entries[3];
        return new math_2.Vector([0, 2 * xError, 2 * yError, 2 * thetaError]);
    }
}
class Lesson {
    constructor(name, tep1, tep2, maxAngle, trials, maxSteps, type) {
        this.name = name;
        this.tep1 = tep1;
        this.tep2 = tep2;
        this.maxAngle = maxAngle;
        this.trials = trials;
        this.maxSteps = maxSteps;
        this.type = type;
    }
    getName() {
        return this.name;
    }
    getAngleType() {
        return this.type;
    }
    getTep1() {
        return this.tep1;
    }
    getTep2() {
        return this.tep2;
    }
    getMaxAngle() {
        return this.maxAngle;
    }
    getNumberOfTrials() {
        return this.trials;
    }
    getMaxSteps() {
        return this.maxSteps;
    }
}
const fs = require("fs");
try {
    let savedWeights = fs.readFileSync("./emulator_weights").toString();
    let parsedWeights = JSON.parse(savedWeights);
    implementation_1.emulatorNet.loadWeights(parsedWeights);
}
catch (err) {
    console.log("No weights found. Using random weights!");
}
let world = new world_1.World();
let truckLength = world.truck.getTruckLength();
let degree5 = Math.PI / 36;
let degree10 = Math.PI / 18;
let degree20 = Math.PI / 9;
let degree30 = Math.PI / 6;
let degree40 = Math.PI / 4.5;
let lessons = [];
let lesson1 = new Lesson("1", new math_1.Point(0.4 * truckLength, 0), new math_1.Point(0.6 * truckLength, 0), [-degree10, degree10], 5000, 20, world_1.AngleType.CAB);
lessons.push(lesson1);
let controllerTrainer = new ControllerTrainer(implementation_1.emulatorNet, implementation_1.controllerNet, lessons, world);
controllerTrainer.train();
//# sourceMappingURL=trainController.js.map