import {World, Dock} from '../model/world';
import {NeuralNet} from './net'
import {Vector} from './math'
import {Angle} from '../math'

export class TrainTruckEmulator {
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
    public trainStep(nextSteeringAngle: number): boolean {
        let stateVector = this.world.truck.getStateVector();
        stateVector = stateVector.getWithNewElement(nextSteeringAngle);
        let result = this.neuralNet.forward(stateVector);

        let retVal = this.world.nextTimeStep(nextSteeringAngle);
        let expectedVector = this.world.truck.getStateVector();
        let error = this.neuralNet.backward(result, expectedVector);

        return retVal && !result.isEntryNaN();
    }

    public train(epochs: number) {
        let nextSteeringAngle = Math.random() * 2 - 1;
        for (let i = 0; i < epochs; i++) {
            let cont = this.trainStep(nextSteeringAngle);
            if (!cont) {
                return i;
            }
        }
        return epochs;
    }
}

export class TrainTruckController {
    public errors: Array<number> = [];
    public fixedEmulator = false;
    private maxSteps = 100;
    private performedTrainSteps = 0;
    private increaseDifficultyEpisodeDiff = 500;

    private currentMaxDistFromDock: number = 10;
    private currentMinDistFromDock: number = 10;
    private currentMaxDockAngle: Angle = Math.PI / 6; // 30 degrees
    private currentMaxAdditionalTrailerAngle: Angle = Math.PI / 36; // start with 30 degrees
    private currentMaxCabinTrailerAngle: Angle = Math.PI / 36; // start with 30 degrees at most

    public constructor(private world: World, private controllerNet: NeuralNet, private emulatorNet: NeuralNet) {
        // TODO: verify compatibility of emulator net and controller net
    }

    public train(trials: number) {
        this.fixEmulator(true);
        for (let i = 0; i < trials; i++) {
            this.trainStep();
        }
        this.fixEmulator(false);
    }

    public getErrorCurve(): Array<number> {
        return this.errors;
    }
    
    public prepareTruckPosition() {
        let distFromDock = [this.currentMinDistFromDock, this.currentMaxDistFromDock];
        let maxDockAngle = [- this.currentMaxDockAngle, this.currentMaxDockAngle];
        let maxAdditionalTrailerAngle = [- this.currentMaxAdditionalTrailerAngle, this.currentMaxAdditionalTrailerAngle];
        let maxCabinTrailerAngle = [- this.currentMaxCabinTrailerAngle, this.currentMaxCabinTrailerAngle];
        this.world.randomizeMax(distFromDock, maxDockAngle, maxAdditionalTrailerAngle, maxCabinTrailerAngle );        
    }

    private fixEmulator(fix: boolean) {
        if (this.fixedEmulator != fix) {
            this.emulatorNet.fixWeights(fix); // do not train emulator
            this.fixedEmulator = fix;
        }
    }

    public trainStep() {
        this.fixEmulator(true);

        let currentState = this.world.truck.getStateVector();
        console.log("[TrainTruckCnotroller] Initial State: ", currentState.toString());
        let canContinue = true;
        let controllerSignals = [];
        let statesFromEmulator = [];
        let i = 0;
        while (canContinue) {
            let controllerSignal = this.controllerNet.forward(currentState);
            let stateWithSteering = currentState.getWithNewElement(controllerSignal.entries[0]);
            // TODO: remove these variables => replace with counter
            controllerSignals.push(controllerSignal);

            currentState = this.emulatorNet.forward(stateWithSteering);
            statesFromEmulator.push(currentState);

            canContinue = this.world.nextTimeStep(controllerSignal.entries[0]);
            if (i > this.maxSteps) {
                break;
//                throw Error("ugh")
            }
            i++;
        }

        // we hit the end => calculate our error, backpropagate
        let finalState = this.world.truck.getStateVector();
        let dock = this.world.dock;

        console.log("Angle: " + finalState.entries[5])
        let controllerDerivative = this.calculateErrorDerivative(finalState, dock);
        console.log("Angle Derivative: " + controllerDerivative.entries[5]);
        let error = this.calculateError(finalState, dock);
        console.log("[TruckController] Remaining Error: ", error);
        this.errors.push(error);

        for (let i = statesFromEmulator.length; i >= 0; i--){ 
            let emulatorDerivative = this.emulatorNet.backwardWithGradient(controllerDerivative, false);
            let steeringSignalDerivative = emulatorDerivative.entries[6]; // last entry
            controllerDerivative = this.controllerNet.backwardWithGradient(new Vector([steeringSignalDerivative]), true);
        }
        this.controllerNet.updateWithAccumulatedWeights();

        this.fixEmulator(false);
        this.performedTrainSteps++;
        this.updateLimitationParameters();
    }

    private updateLimitationParameters() {
        if (this.performedTrainSteps % this.increaseDifficultyEpisodeDiff == 0) {
            this.currentMaxDistFromDock = Math.min(this.currentMaxDistFromDock + 2, 50);

            this.currentMaxAdditionalTrailerAngle = Math.min(2 * Math.PI, this.currentMaxAdditionalTrailerAngle + Math.PI / 36);// 5 degrees

            this.currentMaxCabinTrailerAngle = Math.min(Math.PI / 2, this.currentMaxCabinTrailerAngle + Math.PI / 36);
            this.currentMaxDockAngle = Math.min(Math.PI / 2.5, this.currentMaxDockAngle + Math.PI / 36);
            this.maxSteps += 25;        
        }
    }

    private calculateError(finalState: Vector, dock: Dock): number {
        let xTrailer = finalState.entries[3];
        let yTrailer = finalState.entries[4];
        let thetaTrailer = finalState.entries[5];
        
        let xDiff = dock.position.x - xTrailer
        let yDiff = dock.position.y - yTrailer
        let thetaDiff = 0 - thetaTrailer

        return xDiff * xDiff + yDiff * yDiff + thetaDiff * thetaDiff;
    }

    private calculateErrorDerivative(finalState: Vector, dock: Dock): Vector {
        // 
        let xTrailer = finalState.entries[3];
        let yTrailer = finalState.entries[4];
        let thetaTrailer = finalState.entries[5];

        // Derivative of SSE
        let xDiff = -1 * (dock.position.x - xTrailer); 
        let yDiff = -1 * (dock.position.y - yTrailer);
        let thetaDiff = thetaTrailer
        
        // first 3 do not matter for the error
        return new Vector([0, 0, 0, xDiff, yDiff, thetaDiff]);
    }
}