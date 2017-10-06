"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const math_1 = require("./math");
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
                return i;
            }
        }
        console.log(err / count);
        return epochs;
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
        this.increaseDifficultyEpisodeDiff = 500;
        this.currentMaxDistFromDock = 10;
        this.currentMinDistFromDock = 10;
        this.currentMaxDockAngle = Math.PI / 6;
        this.currentMaxAdditionalTrailerAngle = Math.PI / 36;
        this.currentMaxCabinTrailerAngle = Math.PI / 36;
    }
    train(trials) {
        this.fixEmulator(true);
        for (let i = 0; i < trials; i++) {
            this.trainStep();
        }
        this.fixEmulator(false);
    }
    getErrorCurve() {
        return this.errors;
    }
    prepareTruckPosition() {
        let distFromDock = [this.currentMinDistFromDock, this.currentMaxDistFromDock];
        let maxDockAngle = [-this.currentMaxDockAngle, this.currentMaxDockAngle];
        let maxAdditionalTrailerAngle = [-this.currentMaxAdditionalTrailerAngle, this.currentMaxAdditionalTrailerAngle];
        let maxCabinTrailerAngle = [-this.currentMaxCabinTrailerAngle, this.currentMaxCabinTrailerAngle];
        this.world.randomizeMax();
        console.log("[PrepareTruckPosition] " + this.world.truck.getStateVector());
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
        console.log("[TrainTruckCnotroller] Initial State: ", currentState.toString());
        let canContinue = true;
        let controllerSignals = [];
        let statesFromEmulator = [];
        let i = 0;
        while (canContinue) {
            console.log("[TrainTruckController] Feeding " + currentState);
            let controllerSignal = this.controllerNet.forward(currentState);
            console.log("[TRainTRuckController] " + controllerSignal);
            let stateWithSteering = currentState.getWithNewElement(controllerSignal.entries[0]);
            console.log("[TrainTruckController] State with steering " + stateWithSteering);
            controllerSignals.push(controllerSignal);
            currentState = this.emulatorNet.forward(stateWithSteering);
            console.log("Updated current state: " + currentState);
            statesFromEmulator.push(currentState);
            canContinue = this.world.nextTimeStep(controllerSignal.entries[0]);
            console.log("State should: " + this.world.truck.getStateVector());
            if (i > this.maxSteps) {
                break;
            }
            i++;
        }
        let finalState = this.world.truck.getStateVector();
        let dock = this.world.dock;
        console.log("Angle: " + finalState.entries[5]);
        let controllerDerivative = this.calculateErrorDerivative(finalState, dock);
        console.log("Angle Derivative: " + controllerDerivative.entries[5]);
        let error = this.calculateError(finalState, dock);
        console.log("[TruckController] Remaining Error: ", error);
        this.errors.push(error);
        for (let i = statesFromEmulator.length; i >= 0; i--) {
            let emulatorDerivative = this.emulatorNet.backwardWithGradient(controllerDerivative, false);
            let steeringSignalDerivative = emulatorDerivative.entries[6];
            console.log("[SteeringSignalDerivative] " + steeringSignalDerivative);
            controllerDerivative = this.controllerNet.backwardWithGradient(new math_1.Vector([steeringSignalDerivative]), true);
        }
        this.controllerNet.updateWithAccumulatedWeights();
        this.fixEmulator(false);
        this.performedTrainSteps++;
        this.updateLimitationParameters();
    }
    updateLimitationParameters() {
        if (this.performedTrainSteps % this.increaseDifficultyEpisodeDiff == 0) {
            this.currentMaxDistFromDock = Math.min(this.currentMaxDistFromDock + 2, 50);
            this.currentMaxAdditionalTrailerAngle = Math.min(2 * Math.PI, this.currentMaxAdditionalTrailerAngle + Math.PI / 36);
            this.currentMaxCabinTrailerAngle = Math.min(Math.PI / 2, this.currentMaxCabinTrailerAngle + Math.PI / 36);
            this.currentMaxDockAngle = Math.min(Math.PI / 2.5, this.currentMaxDockAngle + Math.PI / 36);
            this.maxSteps += 25;
        }
    }
    calculateError(finalState, dock) {
        let xTrailer = finalState.entries[3];
        let yTrailer = finalState.entries[4];
        let thetaTrailer = finalState.entries[5];
        let xDiff = xTrailer - dock.position.x;
        let yDiff = yTrailer - dock.position.y;
        let thetaDiff = thetaTrailer - 0;
        return xDiff * xDiff + yDiff * yDiff + thetaDiff * thetaDiff;
    }
    calculateErrorDerivative(finalState, dock) {
        let xTrailer = finalState.entries[3];
        let yTrailer = finalState.entries[4];
        let thetaTrailer = finalState.entries[5];
        let xDiff = xTrailer - dock.position.x;
        let yDiff = yTrailer - dock.position.y;
        let thetaDiff = thetaTrailer;
        return new math_1.Vector([0, 0, 0, xDiff, yDiff, thetaDiff]);
    }
}
exports.TrainTruckController = TrainTruckController;
//# sourceMappingURL=train.js.map