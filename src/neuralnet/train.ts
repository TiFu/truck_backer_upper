import {World, Dock, HasState} from '../model/world';
import {NeuralNet} from './net'
import {Vector} from './math'
import {Angle, Point} from '../math'
import {Lesson} from './lesson'
import { ENGINE_METHOD_ALL } from 'constants';
import { ControllerError } from './error';
import { emulatorNet } from './implementations';

export class TrainTruckEmulator {

    private lastError: number;
    public cabAngleError: number[] = [];
    public xCabError: number[] = []
    public yCabError: number[] = []
    public trailerAngleError: number[] = []
    public xTrailerError: number[] = []
    public yTrailerError: number[] = []

    private trainedSteps = 0;

    public constructor(private world: World, private neuralNet: NeuralNet, private batchSize: number = 1) {
        if (neuralNet.getInputDim() != 6 + 1) {
            throw new Error("Invalid Input Dim! Expected 7 but got " + neuralNet.getInputDim());
        }
        if (neuralNet.getOutputDim() != 6) {
            throw new Error("Invalid Input Dim! Expected 6 but got " + neuralNet.getOutputDim());
        }
    }

    public getPerformedSteps() {
        return this.trainedSteps;
    }

    public getEmulatorNet(): NeuralNet {
        return this.neuralNet;
    }

    public getErrorCurve(): Array<number> {
        return []//this.neuralNet.errors;
    }

    private normalize(stateVector: Vector): void {
        stateVector.entries[0] = (stateVector.entries[0] - 50) / 50; // [0,70] -> [-1, 1]
        stateVector.entries[1] = stateVector.entries[1] / 50; // [-25, 25] -> [-1, 1]
        stateVector.entries[2] /= Math.PI; // [-Math.PI, Math.PI] -> [-1, 1]
        stateVector.entries[3] = (stateVector.entries[3] - 50) / 50; // [0,70] -> [-1, 1]
        stateVector.entries[4] = stateVector.entries[4] / 50; // [-25, 25] -> [-1, 1]
        stateVector.entries[5] /= Math.PI; // [-Math.PI, Math.PI] -> [-1, 1]
    }

    private normalizeOutput(stateVector: Vector) {
        stateVector.entries[0] = (stateVector.entries[0] - 50) / 50; // [0,70] -> [-1, 1]
        stateVector.entries[1] = stateVector.entries[1] / 50; // [-25, 25] -> [-1, 1]
        stateVector.entries[2] /= Math.PI; // [-Math.PI, Math.PI] -> [-1, 1]
        stateVector.entries[3] = (stateVector.entries[3] - 50) / 50; // [0,70] -> [-1, 1]
        stateVector.entries[4] = stateVector.entries[4] / 50; // [-25, 25] -> [-1, 1]
        stateVector.entries[5] /= Math.PI; // [-Math.PI, Math.PI] -> [-1, 1]
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
        this.normalizeOutput(expectedVector);

        //[cdp.x, cdp.y, this.cabinAngle, this.tep.x, this.tep.y, this.trailerAngle]
        // Record errors
        this.xCabError.push(Math.abs(expectedVector.entries[0] - result.entries[0]) * 25);
        this.yCabError.push(Math.abs(expectedVector.entries[1] - result.entries[1]) * 25);
        this.cabAngleError.push(Math.abs(expectedVector.entries[2] - result.entries[2]) * 180);// * Math.PI * 180 / Math.PI
        this.xTrailerError.push(Math.abs(expectedVector.entries[3] - result.entries[3]) * 25);
        this.yTrailerError.push(Math.abs(expectedVector.entries[4] - result.entries[4]) * 25);
        this.trailerAngleError.push(Math.abs(expectedVector.entries[5] - result.entries[5]) * 180);

        let error = this.neuralNet.backward(result, expectedVector, true); // batch update
      //  this.lastError = this.neuralNet.errors[this.neuralNet.errors.length - 1]

        this.trainedSteps++;
        if (this.trainedSteps % this.batchSize == 0) {
            this.neuralNet.updateWithAccumulatedWeights();
        }

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
export class TrainController {
    public errors: Array<number> = [];
    public steeringSignals: Array<number> = [];
    public angleError: Array<number> = [];
    public yError: Array<number> = [];

    public fixedEmulator = false;
    private performedTrainSteps = 0;
    public maxStepErrors = 0;

    public emulatorInputs: any = [];
    private currentLesson: Lesson = null;

    public constructor(private world: World, private realPlant: HasState, private controllerNet: NeuralNet, private emulatorNet: NeuralNet, private errorFunction: ControllerError) {
    }

    public getEmulatorNet() {
        return this.emulatorNet;
    }

    public getControllerNet() {
        return this.controllerNet;
    }

    public setLesson(lesson: Lesson): void {
        this.currentLesson = lesson;
        this.performedTrainSteps = 0;
        this.maxStepErrors = 0;
    }

    public getPerformedTrainSteps(): number {
        return this.performedTrainSteps;
    }
    public hasNextStep(): boolean {
        return this.performedTrainSteps < this.currentLesson.samples;
    }

    public getCurrentLesson(): Lesson {
        return this.currentLesson;
    }

    public trainSingleStep(): number {
        if (this.currentLesson == null) {
            throw new Error("You have to set the current lesson before calling this function!");
        }

        this.prepareTruckPosition();
        let error = this.trainStep();
        this.performedTrainSteps++;
        return error;
    }

    public getErrorCurve(): Array<number> {
        return this.errors;
    }

    // TODO: get rid of this and make independent => HasState gets an init method which accepts a vector
    // (and lesson has a getLimits function which returns a vector)
    private prepareTruckPosition() {
        // tep1, tep2, maxAngleTrailer, maxAngleCabin
        this.realPlant.randomizePosition(this.currentLesson);
    }

    private fixEmulator(fix: boolean) {
        if (this.fixedEmulator != fix) {0
            this.emulatorNet.fixWeights(fix); // do not train emulator
            this.fixedEmulator = fix;
        }
    }

    private normalize(stateVector: Vector): void {
   /*     stateVector.entries[0] = (stateVector.entries[0] - 50) / 50; // [0,70] -> [-1, 1]
        stateVector.entries[1] = stateVector.entries[1] / 50; // [-25, 25] -> [-1, 1]
        stateVector.entries[2] /= Math.PI; // [-Math.PI, Math.PI] -> [-1, 1]
        stateVector.entries[3] = (stateVector.entries[3] - 50) / 50; // [0,70] -> [-1, 1]
        stateVector.entries[4] = stateVector.entries[4] / 50; // [-25, 25] -> [-1, 1]
        stateVector.entries[5] /= Math.PI; // [-Math.PI, Math.PI] -> [-1, 1]
    */
    }

    private normalizeDock(d: Dock) {
        let normX = (d.position.x - 50) / 50
        let normY = (d.position.y) / 50;
        return new Point(normX, normY);
    }

    private trainStep(): number {
        this.fixEmulator(true);
        let canContinue = true;
        let controllerSignals = [];
        let statesFromEmulator = [];
        this.emulatorInputs = [];
        let i = 0;
//        let summedSteeringSignal = 0;

        // start at current state
        while (canContinue) {
            let currentState = this.realPlant.getStateVector();
            console.log("[CurrentState] ", currentState.entries[0]);
            this.normalize(currentState);
            let controllerSignal = this.controllerNet.forward(currentState);
            console.log("[ControllerSignal]", controllerSignal.entries[0]);
            let steeringSignal = controllerSignal.entries[0];

            let stateWithSteering = currentState.getWithNewElement(steeringSignal);

            controllerSignals.push(controllerSignal);
            // derivative depends on output/input
            this.emulatorNet.forward(stateWithSteering);

            canContinue = this.realPlant.nextState(steeringSignal);
            console.log("[Continue]", canContinue)
            // set the next state
            currentState = this.realPlant.getStateVector();
            console.log("[NextState]", currentState.entries[0])

            console.log("------- END -------");
            if (i+1 >= this.currentLesson.maxSteps) {
                console.log("[Max Steps] Reached max steps at " + currentState + " with " + this.currentLesson.maxSteps);
                this.maxStepErrors++;
                break;
            }
            i++;
        }
        let realState = this.realPlant.getStateVector();

        if (i == 0) { // we didn't do anything => no update!
            return NaN;
        }
        // we hit the end => calculate performance error (real position - real target), backpropagate
        let finalState = this.realPlant.getStateVector();
        this.normalize(finalState)
        let dock = this.world.dock;
        let normalizedDock: Point = this.normalizeDock(dock);

        // performance error i.e. real position - real target
        let controllerDerivative = this.calculateErrorDerivative(finalState, normalizedDock);
        let controllerError = this.calculateError(finalState, normalizedDock);
        console.log("[FinalError] ", controllerError);
        console.log("[FinalState] ", finalState.entries[0]);
        console.log("[ControllerDerivative] ", controllerDerivative.entries[0])
        let error = this.calculateError(finalState, normalizedDock);
    //    console.log("[Error] ", error);
        this.errors.push(error);
        for (let j = i-1; j >= 0; j--) {
            console.log("Entering emulator");
            let emulatorDerivative = this.emulatorNet.backwardWithGradient(controllerDerivative, false);
            console.log("[EmulatorDerivative]", emulatorDerivative.entries);
            let steeringSignalDerivative = emulatorDerivative.entries[emulatorDerivative.entries.length - 1]; // last entry
            console.log("Exited emulator");
            console.log("[SteeringSignalDerivative]", steeringSignalDerivative);
            console.log("Entering controler");
            controllerDerivative = this.controllerNet.backwardWithGradient(new Vector([steeringSignalDerivative]), true);
            console.log("[ControllerDerivative] ", controllerDerivative.entries);
            console.log("exited controler");

            // get the error from the emulator and add it to the input error for the controller
            let errorFromEmulator = new Vector(emulatorDerivative.entries.slice(0, 6));
            controllerDerivative.add(errorFromEmulator);
            console.log("[NextEmulatorDerivative]", controllerDerivative.entries);
        }
        this.controllerNet.updateWithAccumulatedWeights();
        this.fixEmulator(false);
        return error;
    }

    // TODO: extract calculate error... => only final state
    private calculateError(finalState: Vector, dock: Point): number {
        return this.errorFunction.getError(finalState);
    }

    private calculateErrorDerivative(finalState: Vector, dock: Point): Vector {
        return this.errorFunction.getErrorDerivative(finalState);
    }
}
