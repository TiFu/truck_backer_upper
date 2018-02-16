import {World, Dock} from '../model/world';
import {NeuralNet} from './net'
import {Vector} from './math'
import {Angle, Point} from '../math'
import {Lesson} from './lesson'
import { ENGINE_METHOD_ALL } from 'constants';

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

    public getEmulatorNet(): NeuralNet {
        return this.neuralNet;
    }

    public getErrorCurve(): Array<number> {
        return this.neuralNet.errors;
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
        stateVector.entries[0] = (stateVector.entries[0] - 50) / 25; // [0,70] -> [-1, 1]
        stateVector.entries[1] = stateVector.entries[1] / 25; // [-25, 25] -> [-1, 1]
        stateVector.entries[2] /= Math.PI; // [-Math.PI, Math.PI] -> [-1, 1]
        stateVector.entries[3] = (stateVector.entries[3] - 50) / 25; // [0,70] -> [-1, 1]
        stateVector.entries[4] = stateVector.entries[4] / 25; // [-25, 25] -> [-1, 1]
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
        this.xCabError.push(Math.abs(expectedVector.entries[0] - result.entries[0]) * 50);
        this.yCabError.push(Math.abs(expectedVector.entries[1] - result.entries[1]) * 50);
        this.cabAngleError.push(Math.abs(expectedVector.entries[2] - result.entries[2]) * 180);// * Math.PI * 180 / Math.PI
        this.xTrailerError.push(Math.abs(expectedVector.entries[3] - result.entries[3]) * 50);
        this.yTrailerError.push(Math.abs(expectedVector.entries[4] - result.entries[4]) * 50);
        this.trailerAngleError.push(Math.abs(expectedVector.entries[5] - result.entries[5]) * 180);

        let error = this.neuralNet.backward(result, expectedVector, true); // batch update
        this.lastError = this.neuralNet.errors[this.neuralNet.errors.length - 1]

        this.trainedSteps++;
        if (this.trainedSteps % this.batchSize == 0) {
            console.log("Batch Update " + this.trainedSteps);
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
export class TrainTruckController {
    public errors: Array<number> = [];
    public steeringSignals: Array<number> = [];
    public angleError: Array<number> = [];
    public yError: Array<number> = [];

    public fixedEmulator = false;
    private performedTrainSteps = 0;
    public maxStepErrors = 0;

    public emulatorInputs: any = [];
    private currentLesson: Lesson = null;

    public constructor(private world: World, private controllerNet: NeuralNet, private emulatorNet: NeuralNet) {
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
    
    private prepareTruckPosition() {
        let length = this.world.truck.getTruckLength() + this.world.truck.getTrailerLength();
        let tep1 = new Point(this.currentLesson.x.min * length, this.currentLesson.y.max * length);
        let tep2 = new Point(this.currentLesson.x.max * length, this.currentLesson.y.min * length);
        let maxAngleTrailer = [this.currentLesson.trailerAngle.min, this.currentLesson.trailerAngle.max];
        let maxAngleCabin = [this.currentLesson.cabAngle.min, this.currentLesson.cabAngle.max];
        this.world.randomizeTruckPosition(tep1, tep2, maxAngleTrailer, maxAngleCabin);
    }

    private fixEmulator(fix: boolean) {
        if (this.fixedEmulator != fix) {0
            this.emulatorNet.fixWeights(fix); // do not train emulator
            this.fixedEmulator = fix;
        }
    }

    private normalize(stateVector: Vector): void {
        stateVector.entries[0] = (stateVector.entries[0] - 50) / 50; // [0,70] -> [-1, 1]
        stateVector.entries[1] = stateVector.entries[1] / 50; // [-25, 25] -> [-1, 1]
        stateVector.entries[2] /= Math.PI; // [-Math.PI, Math.PI] -> [-1, 1]
        stateVector.entries[3] = (stateVector.entries[3] - 50) / 50; // [0,70] -> [-1, 1]
        stateVector.entries[4] = stateVector.entries[4] / 50; // [-25, 25] -> [-1, 1]
        stateVector.entries[5] /= Math.PI; // [-Math.PI, Math.PI] -> [-1, 1]
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
        let summedSteeringSignal = 0;

        while (canContinue) {
            let currentState = this.world.truck.getStateVector();
            this.normalize(currentState);
            let controllerSignal = this.controllerNet.forward(currentState);
            let steeringSignal = controllerSignal.entries[0];
            summedSteeringSignal +=  steeringSignal;
            
            let stateWithSteering = currentState.getWithNewElement(controllerSignal.entries[0]);
            controllerSignals.push(controllerSignal);

            currentState = this.emulatorNet.forward(stateWithSteering);

            this.emulatorInputs.push(stateWithSteering);
            statesFromEmulator.push(currentState);

            canContinue = this.world.nextTimeStep(steeringSignal);
            if (i > this.currentLesson.maxSteps) {
                this.maxStepErrors++;
                break;
            }
            i++;
        }
        this.steeringSignals.push(summedSteeringSignal / i);

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

            // get the error from the emulator and add it to the input error for the controller
            let errorFromEmulator = new Vector(emulatorDerivative.entries.slice(0, 6));
            controllerDerivative.add(errorFromEmulator);
        }
        this.controllerNet.updateWithAccumulatedWeights();
        this.fixEmulator(false);
        return error;
    }

    private calculateError(finalState: Vector, dock: Point): number {
        let xTrailer = finalState.entries[3];
        let yTrailer = finalState.entries[4];
        let thetaTrailer = finalState.entries[5];
        
        // IMPORTANT: x = 0 is at -1 because of the x transformation!
        // we just ignore x < 0 This also explains why it tries to drive a circle with max(xTrailer, 0)
        let xDiff = Math.max(xTrailer, -1) - dock.x
        let yDiff = yTrailer - dock.y
        let thetaDiff = thetaTrailer - 0

        this.angleError.push(Math.abs(thetaDiff))
        this.yError.push(Math.abs(yDiff))
        return 100 * xDiff * xDiff + 100 * yDiff * yDiff + Math.PI * thetaDiff * thetaDiff;
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
        return new Vector([0, 0, 0, 100 * 2 * xDiff, 100 * 2 * yDiff, 100 / Math.PI * 2 * thetaDiff]);
    }
}