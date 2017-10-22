import {NeuralNet} from '../neuralnet/net'
import {World} from '../model/world'
import {Vector} from '../neuralnet/math'
import {Point} from '../math'

export class EmulatorTrainer {
    // NOTE: DO NOT CHANGE UNLESS ALSO CHANGED IN THE CONTROLLER (or move this to a parent class!)
    private tep1 = new Point(-10, 30);
    private tep2 = new Point(80, -30);
    private printHighError = false;
    public constructor(private emulatorNet: NeuralNet, private world: World) {

    }

    public setPrintHighError(print: boolean) {
        this.printHighError = print;
    }

    public train(epochs: number): number {
        let errorSum = 0;
        for (let i = 0; i < epochs; i++) {
            let tep1 = new Point(0,0)
            let tep2 = new Point(1.25,0)
            this.world.randomizeMax(this.tep1, this.tep2, [-Math.PI, Math.PI], [-0.5 * Math.PI, 0.5*Math.PI]);
            let error = this.trainStep();
            errorSum += error;
        }
        return errorSum;
    }

    public predict(inputState: Vector) {
        this.standardize(inputState)
        return this.emulatorNet.forward(inputState);
    }

    private trainStep(): number {
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

        if (this.printHighError && error > 0.1) {
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
        let arr = state.entries.slice(2, state.entries.length)
        let ret = new Vector(arr);
        return ret;
    }

}

function r(min: number, max: number): number {
    return Math.random() * (max - min) + min;
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
    trainTruckEmulator.setPrintHighError(true);
    trainTruckEmulator.train(1000);
} else if (process.argv[2] == "predict") {
    let result = trainTruckEmulator.predict(new Vector(JSON.parse(process.argv[3])))
    console.log(result);
} else {
    let startIteration = Number.parseInt(process.argv[2]);
    for (let i = startIteration; i < 100; i++) {
        let errorSum = trainTruckEmulator.train(10000);
        console.log(i * 10000 + ": " + errorSum);
        fs.writeFileSync("./emulator_weights", JSON.stringify(emulatorNet.getWeights()));
    }
}

