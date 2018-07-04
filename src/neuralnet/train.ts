import { World, Dock, HasState } from '../model/world';
import { NeuralNet } from './net'
import { Vector } from './math'
import { Angle, Point } from '../math'
import { TruckLesson } from './lesson'
import { ENGINE_METHOD_ALL } from 'constants';
import { ControllerError } from './error';
import { emulatorNet } from './implementations';
import { Emulator } from './emulator';

export type MaxStepListener = (steps: number) => void;

export class TrainTruckEmulator {
    private lastError: number = 0;
    public cabAngleError: number[] = [];
    public xCabError: number[] = []
    public yCabError: number[] = []
    public trailerAngleError: number[] = []
    public xTrailerError: number[] = []
    public yTrailerError: number[] = []

    private trainedSteps = 0;
    // TODO: disable data collection?
    public constructor(private plant: HasState, private neuralNet: NeuralNet, private batchSize: number = 1) {
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

    public trainStep(nextSteeringAngle: number): boolean {
        let stateVector = this.plant.getStateVector();

        stateVector = stateVector.getWithNewElement(nextSteeringAngle);

        let result = this.neuralNet.forward(stateVector);
        let retVal = this.plant.nextState(nextSteeringAngle, 1);

        let expectedVector = this.plant.getStateVector();

        //[cdp.x, cdp.y, this.cabinAngle, this.tep.x, this.tep.y, this.trailerAngle]
        // Record errors
        this.xTrailerError.push(Math.abs(expectedVector.entries[0] - result.entries[0]) * 50);
        this.yTrailerError.push(Math.abs(expectedVector.entries[1] - result.entries[1]) * 50);
        this.cabAngleError.push(Math.abs(expectedVector.entries[2] - result.entries[2]) * 180);// * Math.PI * 180 / Math.PI
        if (result.entries.length >= 4) {
            this.trailerAngleError.push(Math.abs(expectedVector.entries[3] - result.entries[3]) * 50);
        }
        this.lastError = this.neuralNet.getError(result, expectedVector);

        let error = this.neuralNet.backward(result, expectedVector, true); // batch update

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
    private lastTrainedLesson: TruckLesson | null = null
    public errors: Array<number> = [];
    public steeringSignals: Array<number> = [];
    public angleError: Array<number> = [];
    public yError: Array<number> = [];

    public fixedEmulator = false;
    private performedTrainSteps = 0;
    public maxStepErrors = 0;

    public emulatorInputs: any = [];
    private currentLesson: TruckLesson | null = null;
    private maxStepListeners: Set<MaxStepListener> = new Set<MaxStepListener>();

    public constructor(private world: World, private realPlant: HasState, private controllerNet: NeuralNet, private emulatorNet: Emulator | null, private errorFunction: ControllerError) {
    }

    public setEmulatorNet(emulator: Emulator) {
        this.emulatorNet = emulator;
    }

    public addMaxStepListener(listener: MaxStepListener) {
        this.maxStepListeners.add(listener);
    }

    private informListeners(steps: number) {
        for (let listener of this.maxStepListeners) {
            listener(steps);
        }
    }

    public setPlant(realPlant: HasState) {
        this.realPlant = realPlant;
    }

    public setLastTrainedLesson(lesson: TruckLesson) {
        this.lastTrainedLesson = lesson;
    }

    public getEmulatorNet() {
        return this.emulatorNet;
    }

    public getControllerNet() {
        return this.controllerNet;
    }

    public predict(): number {
        let currentState = this.realPlant.getStateVector();
        this.controllerNet.fixWeights(true); // do not safe input in units
        let controllerSignal = this.controllerNet.forward(currentState);
        return controllerSignal.entries[0];
    }

    public setLesson(lesson: TruckLesson): void {
        this.currentLesson = lesson;
        if (lesson !== undefined)
            this.controllerNet.changeOptimizer(lesson.optimizer);

        this.performedTrainSteps = 0;
        this.maxStepErrors = 0;
    }

    public getPerformedTrainSteps(): number {
        return this.performedTrainSteps;
    }

    public hasNextStep(): boolean {
        if (!this.currentLesson) {
            return false;
        }
        return this.performedTrainSteps < this.currentLesson.samples;
    }

    public getCurrentLesson(): TruckLesson | null {
        return this.currentLesson;
    }

    public trainSingleStep(): number {
        if (!this.currentLesson) {
            throw new Error("You have to set the current lesson before calling this function!");
        }
        console.log("training step");
        this.prepareTruckPosition();
        let error = this.trainStep();
        this.lastTrainedLesson = this.currentLesson;
        this.performedTrainSteps++;
        return error;
    }

    public getErrorCurve(): Array<number> {
        return this.errors;
    }

    private prepareTruckPosition() {
        this.realPlant.randomizePosition(this.currentLesson as TruckLesson);
    }

    private fixEmulator(fix: boolean) {
        if (this.emulatorNet && this.fixedEmulator != fix) {
            0
            this.emulatorNet.setNotTrainable(fix); // do not train emulator
            this.fixedEmulator = fix;
        }
    }

    // TODO: duplicate code
    private normalizeDock(d: Dock) {
        let normX = (d.position.x - 50) / 50
        let normY = (d.position.y) / 50;
        return new Point(normX, normY);
    }

    private trainStep(): number {
        if (!this.emulatorNet){
            throw new Error("The emulator net has to be initialized before trainin gcan begin!");
        }
        this.fixEmulator(true);
        let canContinue = true;
        let controllerSignals = [];
        let statesFromEmulator = [];
        this.emulatorInputs = [];
        let i = 0;

        let outputState = this.realPlant.getOriginalState();

        // start at current state
        let positions = [];
        while (canContinue) {
            let currentState = this.realPlant.getStateVector();
            positions.push(this.realPlant.getOriginalState());

            let controllerSignal = this.controllerNet.forward(currentState);

            let steeringSignal = controllerSignal.entries[0];

            let stateWithSteering = currentState.getWithNewElement(steeringSignal);

            this.emulatorNet.forward(stateWithSteering);

            canContinue = this.realPlant.nextState(steeringSignal, 1);

            // set the next state
            currentState = this.realPlant.getStateVector();
            outputState = this.realPlant.getOriginalState();

            if (canContinue && i + 1 >= (this.currentLesson as TruckLesson).maxSteps) {
                this.informListeners(i);
                this.controllerNet.clearInputs();
                this.emulatorNet.clearInputs();
                this.maxStepErrors++;

                return 0;
            }
            i++;
        }
        let realState = this.realPlant.getStateVector();

        if (i == 0) { // we didn't do anything => no update!
            return NaN;
        }

        // we hit the end => calculate performance error (real position - real target), backpropagate
        let finalState = this.realPlant.getStateVector();
        let dock = this.world.dock;
        let normalizedDock: Point = this.normalizeDock(dock);

        // performance error i.e. real position - real target
        let controllerDerivative = this.calculateErrorDerivative(finalState, normalizedDock);
        let controllerError = this.calculateError(finalState, normalizedDock);

        let error = this.calculateError(finalState, normalizedDock);

        for (let j = i - 1; j >= 0; j--) {

            let emulatorDerivative = this.emulatorNet.backward(controllerDerivative); //.backwardWithGradient(controllerDerivative, false);

            let steeringSignalDerivative = emulatorDerivative.entries[emulatorDerivative.entries.length - 1]; // last entry

            controllerDerivative = this.controllerNet.backwardWithGradient(new Vector([steeringSignalDerivative]), true);

            // get the error from the emulator and add it to the input error for the controller
            // remove the last element
            let errorFromEmulator = new Vector(emulatorDerivative.entries.slice(0, emulatorDerivative.entries.length - 1));

            controllerDerivative.add(errorFromEmulator);
        }

        this.controllerNet.updateWithAccumulatedWeights();
        this.fixEmulator(false);
        let endState = this.realPlant.getOriginalState();
        let endError = this.errorFunction.getError(this.realPlant.getStateVector());

        return error;
    }

    private calculateError(finalState: Vector, dock: Point): number {
        return this.errorFunction.getError(finalState);
    }

    private calculateErrorDerivative(finalState: Vector, dock: Point): Vector {
        return this.errorFunction.getErrorDerivative(finalState);
    }
}
