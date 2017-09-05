declare var require: any; // trust me require exists
import * as React from 'react'
import WorldVisualization from "./WorldVisualization"
import {World} from './model/world'
import {TrainTruckEmulator} from './neuralnet/train'
import {emulatorNet} from './neuralnet/implementations'

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

    private emulatorTrainSteps = 0;
    private emulatorTrainStepsTarget = 0;
    private emulatorTrainStepsPerFrame = 1;
    private emulatedSteps = 5;

    private lastTimestamp: number;

    public constructor(props: {}) {
        super(props)
        if (Simulation.instance) throw Error("Already instantiated")
        else Simulation.instance = this;
        this.state = {world: new World(), steeringSignal: 0, running: false, emulatorWeights: undefined};
        this.trainTruckEmulator = new TrainTruckEmulator(this.state.world, emulatorNet);
    }

    public steeringSignalChanged(evt: any) {
        this.setState({steeringSignal: parseFloat(evt.target.value)});
    }

    public nextStep() {
        this.state.world.nextTimeStep(this.state.steeringSignal);
        this.forceUpdate();
    }

    public nextEmulatorTrainStep() {
        this.emulatorTrainStepsTarget += 20;
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
        for (let i = 0; i < this.emulatorTrainStepsPerFrame && this.emulatorTrainSteps < this.emulatorTrainStepsTarget; i++) {
            this.emulatorTrainSteps++;
            console.log(this.emulatorTrainSteps + " of " + this.emulatorTrainStepsTarget);
            let epochs = 0;
            while (epochs < this.emulatedSteps) {
                epochs += this.trainTruckEmulator.train(this.emulatedSteps);
                this.state.world.randomize();
            }
        }
        this.onFrame(false);
        if (this.emulatorTrainSteps < this.emulatorTrainStepsTarget) {
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
        console.log(this.trainTruckEmulator.getErrorCurve());
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

    public saveEmulatorWeights() {
        console.log("saving emulator weights")
        console.log("Weights: ", this.trainTruckEmulator.getEmulatorNet().getWeights());
        this.setState({emulatorWeights: this.trainTruckEmulator.getEmulatorNet().getWeights()});
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
            
            <HighCharts config={this.getEmulatorErrorConfig()} />
            Emulator Weights: 
            <textarea value={JSON.stringify(this.state.emulatorWeights)}></textarea>
        </div>
        TODO: add neural net controller
//            <input type="button" disabled={this.state.running} onClick={this.nextControllerTrainingStep.bind(this)} value="Train Controller" />
    }
}
