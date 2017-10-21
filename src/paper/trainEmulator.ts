import {NeuralNet} from '../neuralnet/net'
import {World} from '../model/world'
import {Vector} from '../neuralnet/math'
import {Point} from '../math'

export class EmulatorTrainer {
    private tep1 = new Point(-10, 30);
    private tep2 = new Point(80, -30);

    public constructor(private emulatorNet: NeuralNet, private world: World) {

    }

    public train(epochs: number): number {
        let errorSum = 0;
        for (let i = 0; i < epochs; i++) {
            this.world.randomizeMax(this.tep1, this.tep2, [-Math.PI, Math.PI], [-0.5 * Math.PI, 0.5*Math.PI]);
            let error = this.trainStep();
            errorSum += error;
        }
        return errorSum;
    }

    public trainStep(): number {
        let startState = this.getState(this.world.truck.getStateVector());
        let state = this.getState(this.world.truck.getStateVector());
        let nextSteeringSignal = this.getRandomSteeringSignal();

        this.standardize(state);
        let input = state.getWithNewElement(nextSteeringSignal);
        // forward pass
        let result = this.emulatorNet.forward(input);
        this.world.nextTimeStep(nextSteeringSignal);
        let expected = this.getState(this.world.truck.getStateVector());

        let pass = this.emulatorNet.backward(result, expected);
        let error = this.emulatorNet.errors[this.emulatorNet.errors.length - 1];

        if (error > 1) {
            console.log(error)
            console.log("Input state: " + startState);
            console.log("Target State: " + expected);
            console.log("Predicted: " + result);
            console.log("")
        }

        return error;
    }

    private getRandomSteeringSignal() {
        const min = -1
        const max = 1;
        return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
    }

    private standardize(ret: Vector) {
        ret.entries[0] /= Math.PI;
        ret.entries[1] -= this.tep1.x
        ret.entries[1] /= this.tep2.x - this.tep1.x;
        ret.entries[2] -= this.tep1.y
        ret.entries[2] /= this.tep2.y - this.tep1.y;
        ret.entries[3] /= Math.PI;

    }
    private getState(state: Vector): Vector {
        let ret = new Vector(state.entries.slice(2, state.entries.length));
        return ret;
    }

}

import * as fs from 'fs';
import {emulatorNet} from './implementation'
let world = new World();
let trainTruckEmulator = new EmulatorTrainer(emulatorNet, world);

try {
    let savedWeights = fs.readFileSync("./emulator_weights").toString();
    let parsedWeights = JSON.parse(savedWeights);
    emulatorNet.loadWeights(parsedWeights);
} catch(err) {
    console.log("No weights found. Using random weights!");
}
import * as process from 'process'

if (process.argv[2] == "validate") {
    trainTruckEmulator.train(1000);
} else {
    let startIteration = Number.parseInt(process.argv[2]);
    for (let i = startIteration; i < 100; i++) {
        if (i >= 30 && i % 10 == 0) {
            emulatorNet.decreaseLearningRate(0.1);
        } 
        let errorSum = trainTruckEmulator.train(10000);
        console.log(i * 1000 + ": " + errorSum);
        fs.writeFileSync("./emulator_weights", JSON.stringify(emulatorNet.getWeights()));
    }
}