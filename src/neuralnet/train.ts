import {World, Dock} from '../model/world';
import {NeuralNet} from './net'
import {Vector} from './math'
import {Angle, Point} from '../math'

export class TrainTruckEmulator {

    private lastError: number;
    public constructor(private world: World, private neuralNet: NeuralNet) { 
        if (neuralNet.getInputDim() != 6 + 1) {
            throw new Error("Invalid Input Dim! Expected 7 but got " + neuralNet.getInputDim());
        }
        if (neuralNet.getOutputDim() != 6) {
            throw new Error("Invalid Input Dim! Expected 6 but got " + neuralNet.getOutputDim());
            
        }
    }

    public getEmulatorNet(): NeuralNet {
        return this.neuralNet;
    }

    public getErrorCurve(): Array<number> {
        return this.neuralNet.errors;
    }
    private normalize(stateVector: Vector): void {
        stateVector.entries[0] = (stateVector.entries[0] - 100) / 100; // [0,70] -> [-1, 1]
        stateVector.entries[1] = stateVector.entries[1] / 100; // [-25, 25] -> [-1, 1]
        stateVector.entries[2] /= Math.PI; // [-Math.PI, Math.PI] -> [-1, 1]
        stateVector.entries[3] = (stateVector.entries[3] - 100) / 100; // [0,70] -> [-1, 1]
        stateVector.entries[4] = stateVector.entries[4] / 100; // [-25, 25] -> [-1, 1]
        stateVector.entries[5] /= 0.5 * Math.PI; // [-Math.PI, Math.PI] -> [-1, 1]
    }

    public trainStep(nextSteeringAngle: number): boolean {
        // TODO: turn off boundary checks for this train step
        let initialStateVector = this.world.truck.getStateVector();
        let stateVector = this.world.truck.getStateVector();

        // TODO: adapt to same implementation as in keras
        this.normalize(stateVector);
        stateVector = stateVector.getWithNewElement(nextSteeringAngle);
        let result = this.neuralNet.forward(stateVector);

        let retVal = this.world.nextTimeStep(nextSteeringAngle);
        let expectedVector = this.world.truck.getStateVector();
        this.normalize(expectedVector);
        
        let error = this.neuralNet.backward(result, expectedVector);
        this.lastError = this.neuralNet.errors[this.neuralNet.errors.length - 1]

/*        if (this.lastError > 3) {
            console.log(this.lastError)
            console.log("INit: ", initialStateVector.entries)
            console.log("Predicted: ", result.entries)
            console.log("Expected: ", expectedVector.entries)
            console.log("")
        }*/
        return retVal && !result.isEntryNaN();
    }

    public train(epochs: number) {
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

// let's not use this for now
export class TrainTruckController {
    public errors: Array<number> = [];
    public fixedEmulator = false;
    public maxSteps = 8;
    private performedTrainSteps = 0;
    private increaseDifficultyEpisodeDiff = 100;

    public emulatorInputs: any = [];
    private currentMaxDistFromDock: number = 9;
    private currentMaxYDistFromDock: number = 3;
    private currentMinDistFromDock: number = 7;
    private currentMaxTrailerAngle: Angle = Math.PI / 72; // start with 5 degrees
    private currentMaxCabinTrailerAngle: Angle = Math.PI / 72; // start with 5 degrees at most
    private simple = true;

    public maxX: number = 20;

    public limitationSteps = 0;

    public constructor(private world: World, private controllerNet: NeuralNet, private emulatorNet: NeuralNet) {
        // TODO: verify compatibility of emulator net and controller net
    }

    public getEmulatorNet() {
        return this.emulatorNet;
    }

    public setSimple(simple: boolean) {
        this.simple = simple;
    }

    public getControllerNet() {
        return this.controllerNet;
    }

    public train(trials: number): number {
        let errorSum = 0;
        this.fixEmulator(true);
        for (let i = 0; i < trials; i++) { // TODO: this is incorrect. We need to reset the truck! otherwise we do incorrect updates...
            let error = this.trainStep();
            if (!isNaN(error)) {
                errorSum += error;
            }
        }
        this.fixEmulator(false);
        return errorSum / trials;
    }

    public getErrorCurve(): Array<number> {
        return this.errors;
    }
    
    public prepareTruckPosition() {
        let tep1 = new Point(15, 0);
        let tep2 = new Point(this.maxX,0);
        let maxAngleTrailer = [-Math.PI / 12, Math.PI / 12];
        let maxAngleCabin = [0,0];
        this.world.randomizeTruckPosition(tep1, tep2, maxAngleTrailer, maxAngleCabin);
    }

    public prepareTruckPositionSimple() {
 //       this.world.randomizeMax(new Point(this.currentMinDistFromDock, 0), new Point(this.currentMaxDistFromDock, 0), [- this.currentMaxTrailerAngle, this.currentMaxTrailerAngle], [0,0])
    }

    private fixEmulator(fix: boolean) {
        if (this.fixedEmulator != fix) {
            this.emulatorNet.fixWeights(fix); // do not train emulator
            this.fixedEmulator = fix;
        }
    }

    private normalize(stateVector: Vector): void {
        stateVector.entries[0] = (stateVector.entries[0] - 100) / 100; // [0,70] -> [-1, 1]
        stateVector.entries[1] = stateVector.entries[1] / 100; // [-25, 25] -> [-1, 1]
        stateVector.entries[2] /= Math.PI; // [-Math.PI, Math.PI] -> [-1, 1]
        stateVector.entries[3] = (stateVector.entries[3] - 100) / 100; // [0,70] -> [-1, 1]
        stateVector.entries[4] = stateVector.entries[4] / 100; // [-25, 25] -> [-1, 1]
        stateVector.entries[5] /= 0.5 * Math.PI; // [-Math.PI, Math.PI] -> [-1, 1]
    }

    private normalizeDock(d: Dock) {
        let normX = (d.position.x - 100) / 100
        let normY = (d.position.y) / 100;
        return new Point(normX, normY);
    }
    public trainStep(): number {
        this.fixEmulator(true);
        let canContinue = true;
        let controllerSignals = [];
        let statesFromEmulator = [];
        this.emulatorInputs = [];
        let i = 0;

        while (canContinue) {
            let currentState = this.world.truck.getStateVector();
            this.normalize(currentState);
            let controllerSignal = this.controllerNet.forward(currentState);
            let steeringSignal = controllerSignal.entries[0];

            let stateWithSteering = currentState.getWithNewElement(controllerSignal.entries[0]);
            controllerSignals.push(controllerSignal);

            currentState = this.emulatorNet.forward(stateWithSteering);

            this.emulatorInputs.push(stateWithSteering);
            statesFromEmulator.push(currentState);

            canContinue = this.world.nextTimeStep(steeringSignal);
            if (i > this.maxSteps) {
                break;
            }
            i++;
        }

        if (i == 0) { // we didn't do anything => no update!
            return NaN;
        }
        // we hit the end => calculate our error, backpropagate
        let finalState = this.world.truck.getStateVector();
        this.normalize(finalState)
        let dock = this.world.dock;
        let normalizedDock: Point = this.normalizeDock(dock);

        let controllerDerivative = this.calculateErrorDerivative(finalState, normalizedDock);
        let error = this.calculateError(finalState, normalizedDock);
        this.errors.push(error);

        for (let i = statesFromEmulator.length - 1; i >= 0; i--){ 
            let emulatorDerivative = this.emulatorNet.backwardWithGradient(controllerDerivative, false);
            let steeringSignalDerivative = emulatorDerivative.entries[6]; // last entry
            controllerDerivative = this.controllerNet.backwardWithGradient(new Vector([steeringSignalDerivative]), true);
        }
        this.controllerNet.updateWithAccumulatedWeights();
        this.fixEmulator(false);
        this.performedTrainSteps++;
        this.updateLimitationParameters();
        return error;
    }

    public updateLimitationParameters(force: boolean = false) {
        if (force || this.performedTrainSteps % this.increaseDifficultyEpisodeDiff == 0) {
            this.limitationSteps++;
            if (!this.simple) {
                this.currentMaxDistFromDock = Math.min(this.currentMaxDistFromDock + 2, 50);
                this.currentMaxYDistFromDock = Math.min(this.currentMaxYDistFromDock + 1, 25);
                this.currentMaxTrailerAngle = Math.min(Math.PI, this.currentMaxTrailerAngle + Math.PI / 72);
//                this.currentMaxCabinTrailerAngle = Math.min(Math.PI, this.currentMaxTrailerAngle + Math.PI / 36);// 5 degrees

                this.currentMaxCabinTrailerAngle = Math.min(Math.PI / 2, this.currentMaxCabinTrailerAngle + Math.PI / 72);
                console.log("Updated Limitations: ")
                console.log("Max Dist from dock: " + this.currentMaxDistFromDock);
                console.log("Min Dist f rom dock: " + this.currentMinDistFromDock);
                console.log("Max Y Dist from dock: " + this.currentMaxYDistFromDock);
                console.log("Max Trailer Angle: " + this.currentMaxTrailerAngle);
                console.log("Max Cabin Angle: " + this.currentMaxCabinTrailerAngle)
                this.maxSteps += 25;        
            } else {
//                this.currentMaxYDistFromDock = Math.min(this.currentMaxYDistFromDock + 2, 25);
                this.maxX = Math.min(this.maxX + 5, 70);
                this.maxSteps += this.maxX == 70 ? 0 : 3;
//                console.log("Updated limitations:" + this.maxX);
            }
        }
    }

    public calculateError(finalState: Vector, dock: Point): number {
        let xTrailer = finalState.entries[3];
        let yTrailer = finalState.entries[4];
        let thetaTrailer = finalState.entries[5];
        
        // IMPORTANT: x = 0 is at -1 because of the x transformation!
        // we just ignore x < 0 This also explains why it tries to drive a circle with max(xTrailer, 0)
        let xDiff = Math.max(xTrailer, -1) - dock.x
        let yDiff = yTrailer - dock.y
        let thetaDiff = thetaTrailer - 0
        return 30 * xDiff * xDiff + 30 * yDiff * yDiff + thetaDiff * thetaDiff;
    }

    private calculateErrorDerivative(finalState: Vector, dock: Point): Vector {
        // 
        let xTrailer = finalState.entries[3];
        let yTrailer = finalState.entries[4];
        let thetaTrailer = finalState.entries[5];

        // Derivative of SSE
        let xDiff = Math.max(xTrailer,-1) - dock.x; 
        let yDiff = yTrailer - dock.y;
        let thetaDiff = thetaTrailer - 0;
        
        // first 3 do not matter for the error
        return new Vector([0, 0, 0, 30 * 2/3.0 * xDiff, 30 * 2/3.0 * yDiff, 2/3.0 * thetaDiff]);
    }
}