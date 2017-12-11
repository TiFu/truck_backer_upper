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

    constructor(private inputDim: number, private activation: ActivationFunction, initialWeightRange: number) {
        this.fixedWeights = false;
        this.lastInput = []
        this.weights = this.getRandomWeights(inputDim + 1, initialWeightRange); // bias
        this.resetAccumulatedWeights();
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
        this.updateWeights(this.accumulatedWeights);
 //       console.log(this.accumulatedWeights)
        this.resetAccumulatedWeights();
    }

    // Returns derivative wrt to the inputs
    public backward(errorDerivative: Scalar, learningRate: Scalar, accumulateWeigthUpdates: boolean): Vector {
  //      if (this.debug)
   //         console.log("[Unit] Last Sum: " + this.lastSum)
        let activationDerivative = this.activation.applyDerivative(this.lastSum);
        let scalarFactor = errorDerivative * activationDerivative;
        let inputDerivative: Vector = this.weights.getScaled(scalarFactor);
  /*      if (this.debug) {
            console.log(this.weights)
            console.log("Last Sum: " + this.lastSum)
        }*/
  //      if (this.debug)
  //          console.log("[Unit] Error Derivative: " + errorDerivative, "Activation Derivative: " + activationDerivative, "result scalar: " + scalarFactor)
        if (!this.fixedWeights) {
            let weightDerivative: Vector = this.lastInput.pop().getScaled(scalarFactor);
            let update = this.calculateWeightUpdate(learningRate, weightDerivative);
            if (accumulateWeigthUpdates) {
 //               console.log(update)
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
        return weightDerivative.scale(- learningRate);
    }
    private updateWeights( update: Vector) {
        this.lastUpdate = update;
        this.weights.add(update)
    }
}