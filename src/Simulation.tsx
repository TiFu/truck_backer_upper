declare var require: any; // trust me require exists
import * as React from 'react'
import WorldVisualization from "./WorldVisualization"
import {World} from './model/world'
import {TrainTruckEmulator, TrainTruckController} from './neuralnet/train'
import {emulatorNet, controllerNet} from './neuralnet/implementations'
import {Point, Vector} from './math'
const HighCharts = require("react-highcharts");

interface SimulationState {
     world: World;
     steeringSignal: number;
     running: boolean;
     emulatorWeights: Array<Array<Array<number>>>
}
export default class Simulation extends React.Component<{}, SimulationState> {
    static instance: Simulation;
    private trainTruckEmulator: TrainTruckEmulator;
    private trainTruckController: TrainTruckController

    private emulatorNetTextArea: HTMLTextAreaElement;
    private emulatorTrainSteps = 0;
    private emulatorTrainStepsTarget = 0;
    private emulatorTrainStepsPerFrame = 1;
    private emulatedSteps = 5;
    private worldIsSet = false;
    private controllerTrainStepsTarget = 0;
    private controllerTrainSteps = 0;

    private lastTimestamp: number;

    public constructor(props: {}) {
        super(props)
        if (Simulation.instance) throw Error("Already instantiated")
        else Simulation.instance = this;
        this.state = {world: new World(), steeringSignal: 0, running: false, emulatorWeights: undefined};
        this.trainTruckEmulator = new TrainTruckEmulator(this.state.world, emulatorNet);
        this.trainTruckController = new TrainTruckController(this.state.world, controllerNet, emulatorNet);
        TrainTruckController
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
        this.controllerTrainStepsTarget += 1;
        this.setState({running: true})
        this.lastTimestamp = this.lastTimestamp = performance.now();
        window.requestAnimationFrame(this.controllerAniFrameCallback);
    }

    public randomizePosition() {
        let tep = new Point(12,12)
        let tep2 = new Point(58,-13)
        this.state.world.truck.setTruckIntoRandomPosition([tep, tep2], [- Math.PI, Math.PI]);
        this.onFrame(true);
    }
    public prepTrainTruckPositon() {
        this.trainTruckController.prepareTruckPosition();
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
        console.log(this.controllerTrainSteps + " of " + this.controllerTrainStepsTarget);
        this.trainTruckController.prepareTruckPosition();
        this.trainTruckController.trainStep();
        console.log("End of train truck controller");
        if (this.controllerTrainSteps < this.controllerTrainStepsTarget && this.state.running) {
                this.onFrame(true);
                window.requestAnimationFrame(this.controllerAniFrameCallback);
        } else {
                this.setState({running: false});
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
            console.log(delta)
			console.warn(`only ${(1000 / delta).toFixed(1)} fps`);
            delta = 1000 / 5;            
        }
        for (let i = 0; i < this.emulatorTrainStepsPerFrame && this.emulatorTrainSteps < this.emulatorTrainStepsTarget && this.state.running; i++) {
            this.emulatorTrainSteps++;
            console.log(this.emulatorTrainSteps + " of " + this.emulatorTrainStepsTarget);
            let epochs = 0;
            while (epochs < this.emulatedSteps && this.state.running) {
                epochs += this.trainTruckEmulator.train(this.emulatedSteps);
                this.state.world.randomize();
                this.onFrame(true);
            }
        }
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
                    data: this.trainTruckEmulator.getErrorCurve()
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
                    data: this.trainTruckController.getErrorCurve()
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
        console.log("Text Area Content: ", JSON.stringify(this.state.emulatorWeights))
        return <div>
            <WorldVisualization world={this.state.world} />
            SteeringSignal: 
            <input type="text"  onChange={this.steeringSignalChanged.bind(this)}/>
            <input type="button" onClick={this.nextStep.bind(this)} value="Next Time Step" />
            <input type="button" disabled={this.state.running} onClick={this.nextEmulatorTrainStep.bind(this)} value="Train Emulator" />
            <input type="button" disabled={this.state.running} onClick={this.saveEmulatorWeights.bind(this)} value="Save Emulator Weights" />
            <input type="button" disabled={this.state.running} onClick={this.loadEmulatorWeights.bind(this)} value="Load Emulator Weights" />
            <input type="button" disabled={this.state.running} onClick={this.nextControllerTrainStep.bind(this)} value="Train Controller" />
            <input type="button" disabled={this.state.running} onClick={this.prepTrainTruckPositon.bind(this)} value="Prep Position" />
            <input type="button" onClick={this.stopTraining.bind(this)} value="Stop" />
            <input type="button" onClick={this.randomizePosition.bind(this)} value="Randomize Pos" />
            <HighCharts config={this.getEmulatorErrorConfig()} />
            <HighCharts config={this.getControllerErrorConfig()} />
            Emulator Weights: 
            <textarea ref={(input) => this.emulatorNetTextArea = input} value={JSON.stringify(this.state.emulatorWeights)}></textarea>
        </div>
    }
}
