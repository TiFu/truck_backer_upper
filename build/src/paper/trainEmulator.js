"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const world_1 = require("../model/world");
const math_1 = require("../neuralnet/math");
const math_2 = require("../math");
class EmulatorTrainer {
    constructor(emulatorNet, world) {
        this.emulatorNet = emulatorNet;
        this.world = world;
        this.tep1 = new math_2.Point(-10, 30);
        this.tep2 = new math_2.Point(80, -30);
        this.printHighError = false;
    }
    setPrintHighError(print) {
        this.printHighError = print;
    }
    train(epochs) {
        let errorSum = 0;
        for (let i = 0; i < epochs; i++) {
            let tep1 = new math_2.Point(0, 0);
            let tep2 = new math_2.Point(1.25, 0);
            this.world.randomizeMax(this.tep1, this.tep2, [-Math.PI, Math.PI], [-0.5 * Math.PI, 0.5 * Math.PI]);
            let error = this.trainStep();
            errorSum += error;
        }
        return errorSum;
    }
    predict(inputState) {
        this.standardize(inputState);
        return this.emulatorNet.forward(inputState);
    }
    trainStep() {
        let startState = this.getState(this.world.truck.getStateVector());
        let state = this.getState(this.world.truck.getStateVector());
        let nextSteeringSignal = this.getRandomSteeringSignal();
        this.standardize(state);
        let input = state.getWithNewElement(nextSteeringSignal);
        let result = this.emulatorNet.forward(input);
        this.world.nextTimeStep(nextSteeringSignal);
        let expected = this.getState(this.world.truck.getStateVector());
        let pass = this.emulatorNet.backward(result, expected);
        let error = this.emulatorNet.errors[this.emulatorNet.errors.length - 1];
        if (this.printHighError && error > 1) {
            console.log(error);
            console.log("Input state: " + startState);
            console.log("Target State: " + expected);
            console.log("Predicted: " + result);
            console.log("");
        }
        return error;
    }
    getRandomSteeringSignal() {
        const min = -1;
        const max = 1;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    standardize(ret) {
        ret.entries[0] /= Math.PI;
        ret.entries[1] -= this.tep1.x;
        ret.entries[1] /= this.tep2.x - this.tep1.x;
        ret.entries[2] -= this.tep1.y;
        ret.entries[2] /= this.tep2.y - this.tep1.y;
        ret.entries[3] /= Math.PI;
    }
    getState(state) {
        let arr = state.entries.slice(2, state.entries.length);
        let ret = new math_1.Vector(arr);
        return ret;
    }
}
exports.EmulatorTrainer = EmulatorTrainer;
function r(min, max) {
    return Math.random() * (max - min) + min;
}
const fs = require("fs");
const implementation_1 = require("./implementation");
let world = new world_1.World();
world.setWorldLimited(false);
let trainTruckEmulator = new EmulatorTrainer(implementation_1.emulatorNet, world);
try {
    let savedWeights = fs.readFileSync("./emulator_weights").toString();
    let parsedWeights = JSON.parse(savedWeights);
    implementation_1.emulatorNet.loadWeights(parsedWeights);
}
catch (err) {
    console.log("No weights found. Using random weights!");
}
const process = require("process");
if (process.argv[2] == "validate") {
    trainTruckEmulator.setPrintHighError(true);
    trainTruckEmulator.train(1000);
}
else if (process.argv[2] == "predict") {
    let result = trainTruckEmulator.predict(new math_1.Vector(JSON.parse(process.argv[3])));
    console.log(result);
}
else {
    let startIteration = Number.parseInt(process.argv[2]);
    for (let i = startIteration; i < 100; i++) {
        let errorSum = trainTruckEmulator.train(10000);
        console.log(i * 10000 + ": " + errorSum);
        fs.writeFileSync("./emulator_weights", JSON.stringify(implementation_1.emulatorNet.getWeights()));
    }
}
//# sourceMappingURL=trainEmulator.js.map