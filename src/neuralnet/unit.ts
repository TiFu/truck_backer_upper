import {Vector, Scalar} from './math';
import {ActivationFunction} from './activation';

export interface Unit {
    forward(input: Vector): Scalar;
    backward(error: Scalar, learningRate: Scalar, accumulatedWeightUpdates: boolean): Vector;
    updateWithAccumulatedWeights(): void;
    fixWeights(fixed: boolean): void;
    getWeights(): Array<number>;
    loadWeights(weights: Array<number>): void;
    setWeights(weights: Vector): void;
    getLastUpdate(): Vector;
    setDebug(debug: boolean): void;
    clearInputs(): void;
}

export class AdalineUnit implements Unit {
    public lastSum: Scalar;
    private lastInput: Vector[];
    private fixedWeights: boolean;
    private accumulatedWeights: Vector;
    private weights: Vector;
    private lastUpdate: Vector;
    private debug: boolean;
    private learningRate: number = 0;
    private movingAverage: Vector;

    constructor(private inputDim: number, private activation: ActivationFunction, initialWeightRange: number) {
        this.fixedWeights = false;
        this.lastInput = []
        this.weights = this.getRandomWeights(inputDim + 1, initialWeightRange); // bias
        let mvgAvg = new Array(inputDim + 1);
        mvgAvg.fill(0);
        this.movingAverage = new Vector(mvgAvg);
        this.resetAccumulatedWeights();
        console.log("inputDim: ", inputDim, "weights:", this.weights.length);
    }

    public clearInputs() {
        this.lastInput = []
    }
    public setDebug(debug: boolean) {
        this.debug = debug;
    }
    public getLastUpdate(): Vector {
        return this.lastUpdate;
    }

    private getRandomWeights(inputDim: number, initialWeightRange: number): Vector { 
        let random = [];
        for (let i = 0; i < inputDim; i++) {
            random.push(Math.random() * initialWeightRange - 0.5 * initialWeightRange); // [-0.3, 0.3]
        }
//        console.log("Initial Weights: " + random);
        return new Vector(random);
    }

    public setWeights(weights: Vector) {
        if (weights.length != this.weights.length) {
            throw new Error("Unit#setWeights() needs to use inputDim + 1 as dimension.");
        }
        this.weights = weights;
    }
    public saveWeights(): Vector {
        return this.weights
    }

    public loadWeights(weights: Array<number>) {
        this.weights = new Vector(weights);
    }

    public getWeights(): Array<number> {
        return this.weights.entries;
    }

    public forward(input: Vector): Scalar {
        input = input.getWithNewElement(1); // add bias

        this.lastInput.push(input);
        if (input.length != this.weights.length) {
            throw new Error("Invalid Input Size: expected "  + this.weights.length + ", but got " + input.length);
        }

        this.lastSum = this.weights.multiply(input); // last is bias
        if (Number.isNaN(this.lastSum)) {
            console.log("[Unit] Input: " + input);
            console.log("[Unit] Last Sum: " + this.lastSum)
            console.log("[Unit] Weights: ", this.weights.entries);
            console.log("[Unit] Sum: ", this.lastSum);
        }
        let activated = this.activation.apply(this.lastSum);
        if (Number.isNaN(activated))
            console.log("[Unit] Activated: ", activated, "Last Sum: ", this.lastSum);
        return activated;
    }

    public fixWeights(fixed: boolean) {
        this.fixedWeights = fixed;
    }

    private resetAccumulatedWeights() {
        let entries = new Array(this.weights.length);
        entries.fill(0);
        this.accumulatedWeights = new Vector(entries);
    }
    public updateWithAccumulatedWeights() {
//       console.log("Accumulated Weights: " + this.accumulatedWeights);
        for (let i = 0; i < this.accumulatedWeights.length; i++) {
            if (isNaN(this.accumulatedWeights.entries[i])) {
                alert("Found NaN in a weight update");
            }
        }
        this.updateWeights(this.accumulatedWeights);
        this.resetAccumulatedWeights();
    }

    // Returns derivative wrt to the inputs
    public backward(errorDerivative: Scalar, learningRate: Scalar, accumulateWeigthUpdates: boolean): Vector {
        this.learningRate = learningRate;
  //      if (this.debug)
   //         console.log("[Unit] Last Sum: " + this.lastSum)
        let activationDerivative = this.activation.applyDerivative(this.lastSum);
        console.log("Activation Derivative: ", activationDerivative);
        let scalarFactor = errorDerivative * activationDerivative;
        console.log("Weights Factor: ", scalarFactor);
        let inputDerivative: Vector = this.weights.getScaled(scalarFactor);
        console.log("Input Derivative: ", inputDerivative);
  /*      if (this.debug) {
            console.log(this.weights)
            console.log("Last Sum: " + this.lastSum)
        }*/
  //      if (this.debug)
  //          console.log("[Unit] Error Derivative: " + errorDerivative, "Activation Derivative: " + activationDerivative, "result scalar: " + scalarFactor)
        if (!this.fixedWeights) {
            let weightDerivative: Vector = this.lastInput.pop().getScaled(scalarFactor);
            let update = weightDerivative;
            console.log("Weight Derivative:", weightDerivative);
            if (accumulateWeigthUpdates) {
                this.accumulatedWeights.add(update);
            } else {
                this.updateWeights(update);
            }
        }
   /*     if (this.debug) {
            console.log("Input Derivative: ", inputDerivative)
        }*/
        return inputDerivative.getWithoutLastElement();
    }

    private calculateWeightUpdate(learningRate: Scalar, weightDerivative: Vector): Vector {
        let scaledDerivative = new Vector(weightDerivative.entries).multiplyElementWise(weightDerivative).scale(0.1);
        let scaledAverage = this.movingAverage.scale(0.9)
        this.movingAverage = scaledAverage.add(scaledDerivative);
        console.log("New moving average: ", this.movingAverage);
        let copy = new Vector(weightDerivative.entries);
        let elementWiseScaleFactor = [];
        for (let i = 0; i < copy.entries.length; i++){ 
            elementWiseScaleFactor.push(- learningRate / Math.sqrt(this.movingAverage.entries[i] + 10e-8));
        }

        return copy.multiplyElementWise(new Vector(elementWiseScaleFactor));
    }

    private updateWeights( update: Vector) {
        let scaled = this.calculateWeightUpdate(this.learningRate, update);
        this.lastUpdate = scaled;
 //       console.log(update.entries)
        this.weights.add(scaled);
    }
}