import {World, Dock} from '../model/world';
import {NeuralNet} from './net'
import {Vector} from './math'

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
    public constructor(private world: World, private controllerNet: NeuralNet, private emulatorNet: NeuralNet) {
        // TODO: verify compatibility of emulator net and controller net
    }

    public train(trials: number) {
        this.fixEmulator(true);
        for (let i = 0; i < trials; i++) {
            this.trainStep();
            this.world.randomize();
        }
        this.fixEmulator(false);
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
        let canContinue = true;
        let controllerSignals = [];
        let statesFromEmulator = [];
        while (canContinue) {
            let controllerSignal = this.controllerNet.forward(currentState);
            let stateWithSteering = currentState.getWithNewElement(controllerSignal.entries[0]);
            controllerSignals.push(controllerSignal);

            currentState = this.emulatorNet.forward(stateWithSteering);
            statesFromEmulator.push(currentState);

            let canContinue = this.world.nextTimeStep(controllerSignal.entries[0]);
        }

        // we hit the end => calculate our erro, backpropagate
        let finalState = this.world.truck.getStateVector();
        let dock = this.world.dock;

        let controllerDerivative = this.calculateErrorDerivative(finalState, dock);
        let error = this.calculateError(finalState, dock);
        console.log("[TruckController] Remaining Error: ", error);
        this.errors.push(error);

        for (let i = statesFromEmulator.length; i >= 0; i++){ 
            let emulatorDerivative = this.emulatorNet.backwardWithGradient(controllerDerivative, false);
            let steeringSignalDerivative = emulatorDerivative.entries[6]; // last entry
            controllerDerivative = this.controllerNet.backwardWithGradient(new Vector([steeringSignalDerivative]), true);
        }
        this.controllerNet.updateWithAccumulatedWeights();

        this.fixEmulator(false);
    }

    private calculateError(finalState: Vector, dock: Dock): number {
        let xTrailer = finalState.entries[3];
        let yTrailer = finalState.entries[4];
        let thetaTrailer = finalState.entries[5];
        
        let xDiff = xTrailer - dock.position.x
        let yDiff = yTrailer - dock.position.y
        let thetaDiff = thetaTrailer

        return xDiff * xDiff + yDiff * yDiff + thetaDiff * thetaDiff;
    }

    private calculateErrorDerivative(finalState: Vector, dock: Dock): Vector {
        // 
        let xTrailer = finalState.entries[3];
        let yTrailer = finalState.entries[4];
        let thetaTrailer = finalState.entries[5];

        // Derivative of SSE
        let xDiff = xTrailer - dock.position.x
        let yDiff = yTrailer - dock.position.y
        let thetaDiff = thetaTrailer
        
        // first 3 do not matter for the error
        return new Vector([0, 0, 0, xDiff, yDiff, thetaDiff]);
    }
}