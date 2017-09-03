import {World} from '../model/world';
import {NeuralNet} from './net'

export class TrainTruckEmulator {
    private iterations: number = 0;

    public constructor(private world: World, private neuralNet: NeuralNet) { 
        if (neuralNet.getInputDim() != 6 + 1) {
            throw new Error("Invalid Input Dim! Expected 7 but got " + neuralNet.getInputDim());
        }
        if (neuralNet.getOutputDim() != 6) {
            throw new Error("Invalid Input Dim! Expected 6 but got " + neuralNet.getOutputDim());
            
        }
    }

    public trainStep(): boolean {
        let nextSteeringAngle = Math.random() * 2 - 1;
        let stateVector = this.world.truck.getStateVector();
        stateVector = stateVector.getWithNewElement(nextSteeringAngle);
//        console.log("[TrainTruckEmulator] Steering Angle: ", nextSteeringAngle);
//        console.log("[TrainTruckEmulator] Input: ", stateVector.entries);
        let result = this.neuralNet.forward(stateVector);
//        console.log("[TrainTruckEmulator] Output: ", result.entries);

        let retVal = this.world.nextTimeStep(nextSteeringAngle);
        let expectedVector = this.world.truck.getStateVector();
//        console.log("[TrainTruckEmulator] Actual: ", expectedVector.entries);
        let error = this.neuralNet.backward(result, expectedVector);
        this.iterations++;
        return retVal && !result.isEntryNaN();
    }

    public train(epochs: number) {
        for (let i = 0; i < epochs; i++) {
            console.log("Step: " + i);
            this.trainStep();
        }
    }
}