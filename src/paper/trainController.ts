
import {NeuralNet} from '../neuralnet/net'
import {World, Dock, AngleType} from '../model/world'
import {Point, Angle} from '../math'
import {Vector} from '../neuralnet/math'
import * as assert from 'assert'
import {emulatorNet, controllerNet} from './implementation'

class ControllerTrainer {
    // Standardization parameters
    private tep1 = new Point(-10, 30);
    private tep2 = new Point(80, -30);
    
    public constructor(private emulatorNet: NeuralNet, private controllerNet: NeuralNet, private lessons: Lesson[], private world: World) {
    }

    public train() {
        this.emulatorNet.fixWeights(true);
        for (let lesson of this.lessons) {
            let errorSum = this.trainLesson(lesson)
            console.log("Lesson " + lesson.getName() + ":  " + errorSum)
        }   
        this.emulatorNet.fixWeights(false);     
    }

    private trainLesson(lesson: Lesson): number {
        let errorSum = 0;
        for (let i = 0; i < lesson.getNumberOfTrials(); i++) {
            this.world.randomizeMax2(lesson.getTep1(), lesson.getTep2(), lesson.getMaxAngle(), lesson.getAngleType());
            this.trainStep(lesson.getMaxSteps());
            errorSum = 0
            if (i % 100 == 0) {
                for (let z = 0; z < 1000; z++) {
                    this.world.randomizeMax2(lesson.getTep1(), lesson.getTep2(), lesson.getMaxAngle(), lesson.getAngleType());
                    this.forwardPass(lesson.getMaxSteps());
                    let finalState = this.getEmulatorState(this.world.truck.getStateVector());
                    errorSum += this.getError(finalState, this.world.dock)
                    this.controllerNet.clearInputs();
                    this.emulatorNet.clearInputs();
                }                        
                console.log("Error Sum: " + errorSum)
            }
        }

        errorSum = 0
        for (let i = 0; i < 1000; i++) {
            this.world.randomizeMax2(lesson.getTep1(), lesson.getTep2(), lesson.getMaxAngle(), lesson.getAngleType());
            this.forwardPass(lesson.getMaxSteps());
            let finalState = this.getEmulatorState(this.world.truck.getStateVector());
       //     console.log(finalState)
            errorSum += this.getError(finalState, this.world.dock)
            this.controllerNet.clearInputs();
            this.emulatorNet.clearInputs();
        }                        

        return errorSum;
    }

    // TODO: put scaling somewhere elese maybe parent class of EmulatorTrainer and Controller Trainer
    private standardize(ret: Vector) {
        ret.entries[0] /= Math.PI;
        ret.entries[1] -= this.tep1.x
        ret.entries[1] /= this.tep2.x - this.tep1.x;
        ret.entries[2] -= this.tep1.y
        ret.entries[2] /= this.tep2.y - this.tep1.y;
        ret.entries[3] /= Math.PI;

        if (ret.length == 6) {
            // dock
            ret.entries[4] -= this.tep1.x
            ret.entries[4] /= this.tep2.x - this.tep1.x;
            ret.entries[5] -= this.tep1.y
            ret.entries[5] /= this.tep2.y - this.tep1.y;
        }
    }

    private getControllerState(state: Vector): Vector {
        let arr = state.entries.slice(2, state.entries.length)
        let ret = new Vector(arr);
        return ret;
    }

    private getEmulatorState(state: Vector): Vector {
        let arr = state.entries.slice(2, state.entries.length)
        let ret = new Vector(arr);
        return ret;        
    }

    private forwardPass(maxSteps: number) {
                // get the current states
                let canContinue = true
                let i = 0
                while (canContinue && i < maxSteps) {
                    let controllerState = this.getControllerState(this.world.truck.getStateVector());
                    this.standardize(controllerState)
                    let emulatorState = this.getEmulatorState(this.world.truck.getStateVector())
                    console.log(emulatorState.entries)
                    //                    console.log(emulatorState.entries)
                    this.standardize(emulatorState);
                    let controllerNetOutput = this.controllerNet.forward(controllerState);
                    let steeringSignal = controllerNetOutput.entries[0];
                    console.log(steeringSignal)
                    assert(controllerNetOutput.length == 1, "Controller Net should have only 1 output");
                    emulatorState = emulatorState.getWithNewElement(steeringSignal);
//                    console.log(steeringSignal)
                    //console.log("Emulator input: ", emulatorState.entries)
                    let nextEmulatorState = this.emulatorNet.forward(emulatorState);
                    console.log("Predicted state:" + nextEmulatorState.entries)
                    
                    canContinue = this.world.nextTimeStep(steeringSignal);
                    console.log("Real: " + this.getEmulatorState(this.world.truck.getStateVector()).entries)
                    console.log("---")
                    i++;
                }
        
                return i;
    }

    private trainStep(maxSteps: number): number {
        let i = this.forwardPass(maxSteps)

        // we are done. get the last state
        let finalState = this.getEmulatorState(this.world.truck.getStateVector());
        let errorDerivative = this.getErorrDerivative(finalState, this.world.dock);
        let error = this.getError(finalState, this.world.dock)
        while (i > 0) {
//            console.log("##################### I:" + i + " ###############")
//            console.log("------------ EMULATOR -----------");
            let emulatorDerivative = this.emulatorNet.backwardWithGradient(errorDerivative, false);
//            console.log("------ Emulator Derivative ---- ");
//            console.log(emulatorDerivative.entries)
            assert(emulatorDerivative.length == 5, "Incorrect emulator derivative length");
            let steeringSignalDerivative = emulatorDerivative.entries[4] // should be last entry
            let controllerBackwardInput = new Vector([steeringSignalDerivative]);
//            console.log("---------- Contrller ---------")
            let controllerDerivative = this.controllerNet.backwardWithGradient(controllerBackwardInput, true);
//            console.log("------------- Controller Derivative ------")
//            console.log(controllerDerivative.entries)
            assert(controllerDerivative.length == 4, "Incorrect Contrller Derivative length")
            
            errorDerivative = new Vector(controllerDerivative.entries.slice(0,4));
            assert(errorDerivative.length == 4);
            i--
 //           console.log()
        }


        // final update
        this.controllerNet.updateWithAccumulatedWeights();

        return error;
    }

    private getError(emulatorState: Vector, dock: Dock): number {
        let xError = dock.position.x - Math.max(emulatorState.entries[1], 0)
        let yError = dock.position.y - emulatorState.entries[2]
        let thetaError = 0 - emulatorState.entries[3]

        return xError * xError + yError * yError + thetaError * thetaError
    }

    private getErorrDerivative(emulatorState: Vector, dock: Dock): Vector {
        let xError = dock.position.x - Math.max(emulatorState.entries[1],0)
        let yError = dock.position.y - emulatorState.entries[2]
        let thetaError = 0 - emulatorState.entries[3]
        return new Vector([0, 2 * xError, 2 * yError, 2 * thetaError]);
    }
}

class Lesson {

    constructor(private name: string, private tep1: Point, private tep2: Point, private maxAngle: Angle[], private trials: number, private maxSteps: number, private type: AngleType) {

    }

    public getName(): string {
        return this.name;        
    }
    public getAngleType(): AngleType {
        return this.type;
    }

    public getTep1(): Point {
        return this.tep1;
    }

    public getTep2(): Point {
        return this.tep2;
    }

    public getMaxAngle(): Angle[] {
        return this.maxAngle;
    }

    public getNumberOfTrials(): number {
        return this.trials;
    }

    public getMaxSteps(): number {
        return this.maxSteps;
    }
}


import * as fs from 'fs'
try {
    let savedWeights = fs.readFileSync("./emulator_weights").toString();
    let parsedWeights = JSON.parse(savedWeights);
    emulatorNet.loadWeights(parsedWeights);
} catch(err) {
    console.log("No weights found. Using random weights!");
}

let world = new World();
// define the lessons used
let truckLength = world.truck.getTruckLength()
let degree5 = Math.PI  / 36
let degree10 = Math.PI  / 18;
let degree20 = Math.PI / 9;
let degree30 = Math.PI / 6;
let degree40 = Math.PI / 4.5;

let lessons: Lesson[] = []

let lesson1 = new Lesson("1", new Point(0.4 * truckLength, 0), new Point(0.6 * truckLength, 0) ,[- degree30, degree30], 1, 20, AngleType.CAB);
lessons.push(lesson1)
/*let lesson2 = new Lesson("2", new Point(0.4 * truckLength, 0), new Point(0.6 * truckLength, 0), [-degree10, degree10], 5000, 20, AngleType.CAB);
lessons.push(lesson2)
let lesson3 = new Lesson("3", new Point(0.4 * truckLength, 0), new Point(0.6 * truckLength, 0), [-degree20, degree20], 5000, 30, AngleType.CAB);
lessons.push(lesson3);
let lesson4 = new Lesson("4", new Point(1 * truckLength, 0), new Point(1.25 * truckLength, 0), [-degree10, degree10], 1000, 20, AngleType.CAB);
lessons.push(lesson4);
let lesson5 = new Lesson("5", new Point(1 * truckLength, 0), new Point(1.25 * truckLength, 0), [-degree10, degree10], 1000, 20, AngleType.CAB);
lessons.push(lesson5);
let lesson6 = new Lesson("6", new Point(1 * truckLength, 0), new Point(1.25 * truckLength, 0), [-degree10,degree10], 1000, 20, AngleType.CAB);
lessons.push(lesson6);
let lesson7 = new Lesson("7", new Point(1 * truckLength, 0), new Point(1.25 * truckLength, 0), [-degree10,degree10], 1000, 20, AngleType.CAB);
lessons.push(lesson7);
*/
let controllerTrainer = new ControllerTrainer(emulatorNet, controllerNet, lessons, world);
controllerTrainer.train();