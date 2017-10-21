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
    public trainStep(nextSteeringAngle: number): boolean {
        let stateVector = this.world.truck.getStateVector();

        stateVector.entries[0] = (stateVector.entries[0] - 35) / 35; // [0,70] -> [-1, 1]
        stateVector.entries[1] = stateVector.entries[1] / 25; // [-25, 25] -> [-1, 1]
        stateVector.entries[2] /= Math.PI; // [-Math.PI, Math.PI] -> [-1, 1]
        stateVector.entries[3] = (stateVector.entries[3] - 35) / 35; // [0,70] -> [-1, 1]
        stateVector.entries[4] = stateVector.entries[4] / 25; // [-25, 25] -> [-1, 1]
        stateVector.entries[5] /= Math.PI; // [-Math.PI, Math.PI] -> [-1, 1]
        
        stateVector = stateVector.getWithNewElement(nextSteeringAngle);
        let result = this.neuralNet.forward(stateVector);

        let retVal = this.world.nextTimeStep(nextSteeringAngle);
        let expectedVector = this.world.truck.getStateVector();
        let error = this.neuralNet.backward(result, expectedVector);
        this.lastError = this.neuralNet.errors[this.neuralNet.errors.length - 1]

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

export class TrainTruckController {
    public errors: Array<number> = [];
    public fixedEmulator = false;
    private maxSteps = 100;
    private performedTrainSteps = 0;
    private increaseDifficultyEpisodeDiff = 25000;

    public emulatorInputs: any = [];
    private currentMaxDistFromDock: number = 9;
    private currentMaxYDistFromDock: number = 3;
    private currentMinDistFromDock: number = 7;
    private currentMaxTrailerAngle: Angle = Math.PI / 36; // start with 5 degrees
    private currentMaxCabinTrailerAngle: Angle = Math.PI / 36; // start with 5 degrees at most
    private simple = false;

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
        this.world.randomizeMax(new Point(this.currentMinDistFromDock, this.currentMaxYDistFromDock), new Point(this.currentMaxDistFromDock, -this.currentMaxYDistFromDock), [-this.currentMaxTrailerAngle, this.currentMaxTrailerAngle], [-this.currentMaxCabinTrailerAngle, this.currentMaxCabinTrailerAngle]);    
    }

    public prepareTruckPositionSimple() {
        this.world.randomizeMax(new Point(this.currentMinDistFromDock, 0), new Point(this.currentMaxDistFromDock, 0), [0,0], [0,0])
    }

    private fixEmulator(fix: boolean) {
        if (this.fixedEmulator != fix) {
            this.emulatorNet.fixWeights(fix); // do not train emulator
            this.fixedEmulator = fix;
        }
    }

    public trainStep(): number {
        this.fixEmulator(true);
        let currentState = this.world.truck.getStateVector();
        let canContinue = true;
        let controllerSignals = [];
        let statesFromEmulator = [];
        this.emulatorInputs = [];
        let i = 0;
        while (canContinue) {
            let controllerSignal = this.controllerNet.forward(currentState);

            currentState.entries[0] = (currentState.entries[0] - 35) / 35; // [0,70] -> [-1, 1]
            currentState.entries[1] = currentState.entries[1] / 25; // [-25, 25] -> [-1, 1]
            currentState.entries[2] /= Math.PI; // [-Math.PI, Math.PI] -> [-1, 1]
            currentState.entries[3] = (currentState.entries[3] - 35) / 35; // [0,70] -> [-1, 1]
            currentState.entries[4] = currentState.entries[4] / 25; // [-25, 25] -> [-1, 1]
            currentState.entries[5] /= Math.PI; // [-Math.PI, Math.PI] -> [-1, 1]
    
            let stateWithSteering = currentState.getWithNewElement(controllerSignal.entries[0]);
            controllerSignals.push(controllerSignal);

            currentState = this.emulatorNet.forward(stateWithSteering);
            this.emulatorInputs.push(stateWithSteering);
            statesFromEmulator.push(currentState);

            canContinue = this.world.nextTimeStep(controllerSignal.entries[0]);
            // use truck kinematics for sensing the error
            // TODO: is this correct?
//            console.log("Emulator Prediction: " + )
            currentState = this.world.truck.getStateVector();
            if (i > this.maxSteps) {
                break;
//                throw Error("ugh")
            }
            i++;
        }

        if (i == 0) { // we didn't do anything => no update!
            return NaN;
        }
        // we hit the end => calculate our error, backpropagate
        let finalState = this.world.truck.getStateVector();
//        console.log(finalState.entries[3], finalState.entries[4], finalState.entries[5]);
        let dock = this.world.dock;

//        console.log("[Net] Final State: " + finalState)
//        console.log("[Emulator State] " + statesFromEmulator[statesFromEmulator.length - 1])
        let controllerDerivative = this.calculateErrorDerivative(finalState, dock);
//        console.log("[Net] Controller Derivative: " + controllerDerivative)
        let error = this.calculateError(finalState, dock);
        this.errors.push(error);

        for (let i = statesFromEmulator.length - 1; i >= 0; i--){ 
//            console.log("----------------------------------------------------------------") 
//            console.log("------------------------- Stack " + i + " --------------------------------") 
//            console.log("----------------------------------------------------------------") 
//            console.log("############# EMULATOR ##########")
            let emulatorDerivative = this.emulatorNet.backwardWithGradient(controllerDerivative, false);
//            console.log("Emulator Derivative");
//            console.log(emulatorDerivative.entries)
////            return 0.0;
            let steeringSignalDerivative = emulatorDerivative.entries[6]; // last entry
//            console.log("[Net] Steering Signal Derivative:" + steeringSignalDerivative);
////            console.log("############# Controller ##########")
            controllerDerivative = this.controllerNet.backwardWithGradient(new Vector([steeringSignalDerivative]), true);
//            console.log("[Net] Controller Derivative: " + controllerDerivative)
        }
        this.controllerNet.updateWithAccumulatedWeights();
//        console.log("---------------------------------")
        this.fixEmulator(false);
        this.performedTrainSteps++;
        this.updateLimitationParameters();
        return error;
    }

    private updateLimitationParameters() {
        if (this.performedTrainSteps % this.increaseDifficultyEpisodeDiff == 0) {
            if (!this.simple) {
                this.currentMaxDistFromDock = Math.min(this.currentMaxDistFromDock + 2, 50);
                this.currentMaxYDistFromDock = Math.min(this.currentMaxYDistFromDock + 1, 25);
                this.currentMaxTrailerAngle = Math.min(Math.PI, this.currentMaxTrailerAngle + Math.PI / 36);
    //           this.currentMaxCabinTrailerAngle = Math.min(Math.PI, this.currentMaxTrailerAngle + Math.PI / 36);// 5 degrees

                this.currentMaxCabinTrailerAngle = Math.min(Math.PI / 2, this.currentMaxCabinTrailerAngle + Math.PI / 36);
                this.maxSteps += 25;        
            } else {
//                this.currentMaxYDistFromDock = Math.min(this.currentMaxYDistFromDock + 2, 25);
                this.currentMaxDistFromDock = Math.min(this.currentMaxDistFromDock + 1, 50); 
                console.log("Updated limitations:" + this.currentMaxDistFromDock);
            }
        }
    }

    public calculateError(finalState: Vector, dock: Dock): number {
        let xTrailer = finalState.entries[3];
        let yTrailer = finalState.entries[4];
        let thetaTrailer = finalState.entries[5];
        
        let xDiff = Math.max(xTrailer, 0) - dock.position.x
        let yDiff = yTrailer - dock.position.y
        let thetaDiff = thetaTrailer - 0

        return 1/2 * (xDiff * xDiff + yDiff * yDiff + thetaDiff * thetaDiff);
    }

    private calculateErrorDerivative(finalState: Vector, dock: Dock): Vector {
        // 
        let xTrailer = finalState.entries[3];
        let yTrailer = finalState.entries[4];
        let thetaTrailer = finalState.entries[5];

        // Derivative of SSE
        let xDiff = Math.max(xTrailer,0) - dock.position.x; 
        let yDiff = yTrailer - dock.position.y;
        let thetaDiff = thetaTrailer - 0;
        
        // first 3 do not matter for the error
        return new Vector([0, 0, 0, xDiff, yDiff, thetaDiff]);
    }
}