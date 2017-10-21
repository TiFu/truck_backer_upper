"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const math_1 = require("./math");
const math_2 = require("../math");
class TrainTruckEmulator {
    constructor(world, neuralNet) {
        this.world = world;
        this.neuralNet = neuralNet;
        if (neuralNet.getInputDim() != 6 + 1) {
            throw new Error("Invalid Input Dim! Expected 7 but got " + neuralNet.getInputDim());
        }
        if (neuralNet.getOutputDim() != 6) {
            throw new Error("Invalid Input Dim! Expected 6 but got " + neuralNet.getOutputDim());
        }
    }
    getEmulatorNet() {
        return this.neuralNet;
    }
    getErrorCurve() {
        return this.neuralNet.errors;
    }
    trainStep(nextSteeringAngle) {
        let stateVector = this.world.truck.getStateVector();
        stateVector.entries[0] = (stateVector.entries[0] - 35) / 35;
        stateVector.entries[1] = stateVector.entries[1] / 25;
        stateVector.entries[2] /= Math.PI;
        stateVector.entries[3] = (stateVector.entries[3] - 35) / 35;
        stateVector.entries[4] = stateVector.entries[4] / 25;
        stateVector.entries[5] /= Math.PI;
        stateVector = stateVector.getWithNewElement(nextSteeringAngle);
        let result = this.neuralNet.forward(stateVector);
        let retVal = this.world.nextTimeStep(nextSteeringAngle);
        let expectedVector = this.world.truck.getStateVector();
        let error = this.neuralNet.backward(result, expectedVector);
        this.lastError = this.neuralNet.errors[this.neuralNet.errors.length - 1];
        return retVal && !result.isEntryNaN();
    }
    train(epochs) {
        let nextSteeringAngle = Math.random() * 2 - 1;
        let err = 0;
        let count = 0;
        for (let i = 0; i < epochs; i++) {
            let cont = this.trainStep(nextSteeringAngle);
            err += this.lastError;
            count++;
            if (!cont) {
                return [i, err / count];
            }
        }
        return [epochs, err / count];
    }
}
exports.TrainTruckEmulator = TrainTruckEmulator;
class TrainTruckController {
    constructor(world, controllerNet, emulatorNet) {
        this.world = world;
        this.controllerNet = controllerNet;
        this.emulatorNet = emulatorNet;
        this.errors = [];
        this.fixedEmulator = false;
        this.maxSteps = 100;
        this.performedTrainSteps = 0;
        this.increaseDifficultyEpisodeDiff = 25000;
        this.emulatorInputs = [];
        this.currentMaxDistFromDock = 9;
        this.currentMaxYDistFromDock = 3;
        this.currentMinDistFromDock = 7;
        this.currentMaxTrailerAngle = Math.PI / 36;
        this.currentMaxCabinTrailerAngle = Math.PI / 36;
        this.simple = false;
    }
    getEmulatorNet() {
        return this.emulatorNet;
    }
    setSimple(simple) {
        this.simple = simple;
    }
    getControllerNet() {
        return this.controllerNet;
    }
    train(trials) {
        let errorSum = 0;
        this.fixEmulator(true);
        for (let i = 0; i < trials; i++) {
            let error = this.trainStep();
            if (!isNaN(error)) {
                errorSum += error;
            }
        }
        this.fixEmulator(false);
        return errorSum / trials;
    }
    getErrorCurve() {
        return this.errors;
    }
    prepareTruckPosition() {
        this.world.randomizeMax(new math_2.Point(this.currentMinDistFromDock, this.currentMaxYDistFromDock), new math_2.Point(this.currentMaxDistFromDock, -this.currentMaxYDistFromDock), [-this.currentMaxTrailerAngle, this.currentMaxTrailerAngle], [-this.currentMaxCabinTrailerAngle, this.currentMaxCabinTrailerAngle]);
    }
    prepareTruckPositionSimple() {
        this.world.randomizeMax(new math_2.Point(this.currentMinDistFromDock, 0), new math_2.Point(this.currentMaxDistFromDock, 0), [0, 0], [0, 0]);
    }
    fixEmulator(fix) {
        if (this.fixedEmulator != fix) {
            this.emulatorNet.fixWeights(fix);
            this.fixedEmulator = fix;
        }
    }
    trainStep() {
        this.fixEmulator(true);
        let currentState = this.world.truck.getStateVector();
        let canContinue = true;
        let controllerSignals = [];
        let statesFromEmulator = [];
        this.emulatorInputs = [];
        let i = 0;
        while (canContinue) {
            let controllerSignal = this.controllerNet.forward(currentState);
            currentState.entries[0] = (currentState.entries[0] - 35) / 35;
            currentState.entries[1] = currentState.entries[1] / 25;
            currentState.entries[2] /= Math.PI;
            currentState.entries[3] = (currentState.entries[3] - 35) / 35;
            currentState.entries[4] = currentState.entries[4] / 25;
            currentState.entries[5] /= Math.PI;
            let stateWithSteering = currentState.getWithNewElement(controllerSignal.entries[0]);
            controllerSignals.push(controllerSignal);
            currentState = this.emulatorNet.forward(stateWithSteering);
            this.emulatorInputs.push(stateWithSteering);
            statesFromEmulator.push(currentState);
            canContinue = this.world.nextTimeStep(controllerSignal.entries[0]);
            currentState = this.world.truck.getStateVector();
            if (i > this.maxSteps) {
                break;
            }
            i++;
        }
        if (i == 0) {
            return NaN;
        }
        let finalState = this.world.truck.getStateVector();
        let dock = this.world.dock;
        let controllerDerivative = this.calculateErrorDerivative(finalState, dock);
        let error = this.calculateError(finalState, dock);
        this.errors.push(error);
        for (let i = statesFromEmulator.length - 1; i >= 0; i--) {
            let emulatorDerivative = this.emulatorNet.backwardWithGradient(controllerDerivative, false);
            let steeringSignalDerivative = emulatorDerivative.entries[6];
            controllerDerivative = this.controllerNet.backwardWithGradient(new math_1.Vector([steeringSignalDerivative]), true);
        }
        this.controllerNet.updateWithAccumulatedWeights();
        this.fixEmulator(false);
        this.performedTrainSteps++;
        this.updateLimitationParameters();
        return error;
    }
    updateLimitationParameters() {
        if (this.performedTrainSteps % this.increaseDifficultyEpisodeDiff == 0) {
            if (!this.simple) {
                this.currentMaxDistFromDock = Math.min(this.currentMaxDistFromDock + 2, 50);
                this.currentMaxYDistFromDock = Math.min(this.currentMaxYDistFromDock + 1, 25);
                this.currentMaxTrailerAngle = Math.min(Math.PI, this.currentMaxTrailerAngle + Math.PI / 36);
                this.currentMaxCabinTrailerAngle = Math.min(Math.PI / 2, this.currentMaxCabinTrailerAngle + Math.PI / 36);
                this.maxSteps += 25;
            }
            else {
                this.currentMaxDistFromDock = Math.min(this.currentMaxDistFromDock + 1, 50);
                console.log("Updated limitations:" + this.currentMaxDistFromDock);
            }
        }
    }
    calculateError(finalState, dock) {
        let xTrailer = finalState.entries[3];
        let yTrailer = finalState.entries[4];
        let thetaTrailer = finalState.entries[5];
        let xDiff = Math.max(xTrailer, 0) - dock.position.x;
        let yDiff = yTrailer - dock.position.y;
        let thetaDiff = thetaTrailer - 0;
        return 1 / 2 * (xDiff * xDiff + yDiff * yDiff + thetaDiff * thetaDiff);
    }
    calculateErrorDerivative(finalState, dock) {
        let xTrailer = finalState.entries[3];
        let yTrailer = finalState.entries[4];
        let thetaTrailer = finalState.entries[5];
        let xDiff = Math.max(xTrailer, 0) - dock.position.x;
        let yDiff = yTrailer - dock.position.y;
        let thetaDiff = thetaTrailer - 0;
        return new math_1.Vector([0, 0, 0, xDiff, yDiff, thetaDiff]);
    }
}
exports.TrainTruckController = TrainTruckController;
//# sourceMappingURL=train.js.map