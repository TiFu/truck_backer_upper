declare var require: any; // trust me require exists
import * as React from 'react'
import WorldVisualization from "./WorldVisualization"
import {World} from './model/world'
import {TrainTruckEmulator, TrainController} from './neuralnet/train'
import {emulatorNet, controllerNet} from './neuralnet/implementations'
import {Point, Vector, scalarProduct} from './math'
const HighCharts = require("react-highcharts");
import {LessonView} from './LessonView'
import {createTruckLessons, Lesson} from './neuralnet/lesson'
import { TruckControllerError } from './neuralnet/error';
import {NormalizedTruck} from './model/truck';
import {NeuralNetEmulator} from './neuralnet/emulator';

let lessons: Array<Lesson> = [];

interface SimulationState {
     world: World;
     steeringSignal: number;
     running: boolean;
     emulatorWeights: Array<Array<Array<number>>>
}
export default class Simulation extends React.Component<{}, SimulationState> {
    static instance: Simulation;
    private trainTruckEmulator: TrainTruckEmulator;
    private trainTruckController: TrainController

    private emulatorNetTextArea: HTMLTextAreaElement;
    private emulatorTrainSteps = 0;
    private emulatorTrainStepsTarget = 0;
    private emulatorTrainStepsPerFrame = 1;
    private emulatedSteps = 1;
    private worldIsSet = false;
    private controllerTrainStepsTarget = 0;
    private controllerTrainSteps = 0;

    private lastTimestamp: number;
    private currentLessonIndex = 0;

    public constructor(props: {}) {
        super(props)
        if (Simulation.instance) throw Error("Already instantiated")
        else Simulation.instance = this;
        this.state = {world: new World(), steeringSignal: 0, running: false, emulatorWeights: undefined};
        lessons = createTruckLessons(this.state.world.truck);
        this.trainTruckEmulator = new TrainTruckEmulator(new NormalizedTruck(this.state.world.truck), emulatorNet, 16); // 16 batch size
        this.trainTruckController = new TrainController(this.state.world, this.state.world.truck, controllerNet, new NeuralNetEmulator(emulatorNet), new TruckControllerError(this.state.world.dock.position));
        this.trainTruckController.setLesson(lessons[this.currentLessonIndex]);
    }

    public steeringSignalChanged(evt: any) {
        this.setState({steeringSignal: parseFloat(evt.target.value)});
    }

    public nextStep() {
        let predicted = this.trainTruckEmulator.getEmulatorNet().forward(this.state.world.truck.getStateVector().getWithNewElement(this.state.steeringSignal));
        console.log("[Old Pos is] " + this.state.world.truck.getStateVector());
        console.log(this.state.world.nextTimeStep(this.state.steeringSignal));
        console.log("[New Pos predicted] " + predicted);
        console.log("[New Pos is] " + this.state.world.truck.getStateVector().toString());
        this.forceUpdate();
    }

    public nextControllerTrainStep() {
        this.controllerTrainStepsTarget += 1000;
        this.setState({running: true})
        this.lastTimestamp = performance.now();
        window.requestAnimationFrame(this.controllerAniFrameCallback);
    }

    public randomizePosition() {
        this.state.world.truck.randomizeNoLimits();
        this.onFrame(true);
    }

    public controllerAniFrameCallback = this.controllerAnimationStep.bind(this);
    public controllerAnimationStep(timestamp: number) {
        let delta = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        if (delta > 1000 / 5) {
            console.log(delta)
			console.warn(`only ${(1000 / delta).toFixed(1)} fps`);
            delta = 1000 / 5;            
        }
        this.controllerTrainSteps++;
        this.trainTruckController.trainSingleStep();
        if (this.trainTruckController.hasNextStep() && this.state.running) {
            this.onFrame(true);
            window.requestAnimationFrame(this.controllerAniFrameCallback);
        } else {
            if (!this.trainTruckController.hasNextStep()) {
                this.currentLessonIndex++;
                console.log("Next Lesson: " + this.currentLessonIndex);
                if (this.currentLessonIndex < lessons.length) {
                    this.trainTruckController.setLesson(lessons[this.currentLessonIndex]);
                    if (this.state.running)
                        window.requestAnimationFrame(this.controllerAniFrameCallback);                        
                    return;
                }
            }
        }
    }

    public nextEmulatorTrainStep() {
        this.emulatorTrainStepsTarget += 1000;
        this.setState({running: true})
        this.lastTimestamp = this.lastTimestamp = performance.now();
        window.requestAnimationFrame(this.emulatorAniFrameCallback);
    }

    public emulatorAniFrameCallback = this.emulatorAnimationStep.bind(this);
    public emulatorAnimationStep(timestamp: number) {
        let delta = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        if (delta > 1000 / 5) {
			console.warn(`only ${(1000 / delta).toFixed(1)} fps`);
            delta = 1000 / 5;            
        }
        this.state.world.setWorldLimited(false);
        for (let i = 0; i < this.emulatorTrainStepsPerFrame && this.emulatorTrainSteps < this.emulatorTrainStepsTarget && this.state.running; i++) {
            this.emulatorTrainSteps++;
            console.log(this.emulatorTrainSteps + " of " + this.emulatorTrainStepsTarget);
            let epochs = 0;
            while (epochs < this.emulatedSteps && this.state.running) {
                epochs += this.trainTruckEmulator.train(this.emulatedSteps)[0];
                this.state.world.truck.randomizeNoLimits();
                this.onFrame(true);
            }
        }
        this.state.world.setWorldLimited(true);
        if (this.emulatorTrainSteps < this.emulatorTrainStepsTarget && this.state.running) {
            this.onFrame(false);
            window.requestAnimationFrame(this.emulatorAniFrameCallback);
        } else {
            this.setState({running: false});
        }
    }

    public onFrame(forceRedraw: boolean) {
        if (forceRedraw)
            this.forceUpdate();
        
    }

    private compressErrorCurve(errors: number[]): number[] {
        let compressedErrors = [];
        let sum = 0;
        for (let i = 0; i < errors.length; i++) {
            sum += errors[i];
            if (i > 0 && (i+1) % 100 == 0) {
                compressedErrors.push(sum / 100);
                sum = 0;
            }
        }
        return compressedErrors;
    }

    public getEmulatorErrorConfig() {
        return {
            "chart": {
                "type": "line"
            },
            xAxis: {

            },
            yAxis: {

            },
            series: [
                {
                    name: "Emulator Error",
                    data: this.compressErrorCurve(this.trainTruckEmulator.getErrorCurve())
                }
            ]
        }
    }

    public getCoordinatesError() {
        return {
            "chart": {
                "type": "line"
            },
            xAxis: {

            },
            yAxis: {

            },
            series: [
                {
                    name: "Cabin X Error",
                    data: this.compressErrorCurve(this.trainTruckEmulator.xCabError)
                },
                {
                    name: "Cabin Y Error",
                    data: this.compressErrorCurve(this.trainTruckEmulator.yCabError)                    
                },
                {
                    name: "Trailer X Error",
                    data: this.compressErrorCurve(this.trainTruckEmulator.xTrailerError)
                },
                {
                    name: "Trailer Y Error",
                    data: this.compressErrorCurve(this.trainTruckEmulator.yTrailerError)                    
                }

            ]
        }
    }

    public getAngleError() {
        return {
            "chart": {
                "type": "line"
            },
            xAxis: {

            },
            yAxis: {

            },
            series: [
                {
                    name: "Cab Angle Error",
                    data: this.compressErrorCurve(this.trainTruckEmulator.cabAngleError)
                },
                {
                    name: "Trailer Angle Error",
                    data: this.compressErrorCurve(this.trainTruckEmulator.trailerAngleError)                    
                }
            ]
        }
    }

    public getControllerErrorConfig() {
        return {
            "chart": {
                "type": "line"
            },
            xAxis: {

            },
            yAxis: {

            },
            series: [
                {
                    name: "Controller Error",
                    data: this.compressErrorCurve(this.trainTruckController.getErrorCurve())
                },
                {
                    name: "Steering Signal",
                    data: this.compressErrorCurve(this.trainTruckController.steeringSignals)
                },
                {
                    name: "Angle Error",
                    data: this.compressErrorCurve(this.trainTruckController.angleError)                    
                },
                {
                    name: "Y Error",
                    data: this.compressErrorCurve(this.trainTruckController.yError)                    
                }
            ]
        }
    }
    public saveEmulatorWeights() {
        console.log("saving emulator weights")
        console.log("Weights: ", this.trainTruckEmulator.getEmulatorNet().getWeights());
        this.setState({emulatorWeights: this.trainTruckEmulator.getEmulatorNet().getWeights()});
    }

    public loadEmulatorWeights() {
        let val = this.emulatorNetTextArea.value
        try {
            let newWeights = JSON.parse(val);
            this.trainTruckEmulator.getEmulatorNet().loadWeights(newWeights);
        } catch(e) {
            alert("Invalid Emulator Weights");
        }
    }

    public stopTraining() {
        this.setState({running: false});
    }

    public render() {
        return <div>
            <WorldVisualization world={this.state.world} />
            SteeringSignal: 
            <input type="text"  onChange={this.steeringSignalChanged.bind(this)}/>
            <input type="button" onClick={this.nextStep.bind(this)} value="Next Time Step" />
            <input type="button" disabled={this.state.running} onClick={this.nextEmulatorTrainStep.bind(this)} value="Train Emulator" />
            <input type="button" disabled={this.state.running} onClick={this.saveEmulatorWeights.bind(this)} value="Save Emulator Weights" />
            <input type="button" disabled={this.state.running} onClick={this.loadEmulatorWeights.bind(this)} value="Load Emulator Weights" />
            <input type="button" disabled={this.state.running} onClick={this.nextControllerTrainStep.bind(this)} value="Train Controller" />
            <input type="button" onClick={this.stopTraining.bind(this)} value="Stop" />
            <LessonView lesson={this.trainTruckController.getCurrentLesson()} performedTrainSteps={this.trainTruckController.getPerformedTrainSteps() + this.trainTruckEmulator.getPerformedSteps()} maxStepViolations={this.trainTruckController.maxStepErrors} />           
            <HighCharts config={this.getEmulatorErrorConfig()} />
            <HighCharts config={this.getControllerErrorConfig()} />
            <HighCharts config={this.getAngleError()} />
            <HighCharts config={this.getCoordinatesError()} />
            Emulator Weights: 
            <textarea ref={(input) => this.emulatorNetTextArea = input} value={JSON.stringify(this.state.emulatorWeights)}></textarea>
        </div>
    }
}
