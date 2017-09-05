import * as React from 'react'
import WorldVisualization from "./WorldVisualization"
import {World} from './model/world'
import {TrainTruckEmulator} from './neuralnet/train'
import {emulatorNet} from './neuralnet/implementations'

const HighCharts = require("react-highcharts");

interface SimulationState {
     world: World;
     steeringSignal: number;
     stopSimulation: boolean;
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
        this.state = {world: new World(), steeringSignal: 0, stopSimulation: false};
        this.trainTruckEmulator = new TrainTruckEmulator(this.state.world, emulatorNet);
    }

    public steeringSignalChanged(evt: any) {
        this.setState({steeringSignal: parseFloat(evt.target.value)});
    }

    public nextStep() {
        this.state.world.nextTimeStep(this.state.steeringSignal);
        this.forceUpdate();
    }

    public nextTrainStep() {
        this.emulatorTrainStepsTarget += 20;
        this.lastTimestamp = this.lastTimestamp = performance.now();
        window.requestAnimationFrame(this.aniFrameCallback);
    }

    public aniFrameCallback = this.animationStep.bind(this);
    public animationStep(timestamp: number) {
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
            window.requestAnimationFrame(this.aniFrameCallback);
        } else {
            this.onFrame(true);
        }
    }

    public onFrame(forceRedraw: boolean) {
        if (forceRedraw)
            this.forceUpdate();
        
    }

    public getErrorConfig() {
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
    public render() {
        return <div>
            <WorldVisualization world={this.state.world} />
            SteeringSignal: 
            <input type="text"  onChange={this.steeringSignalChanged.bind(this)}/>
            <input type="button" onClick={this.nextStep.bind(this)} value="Next Time Step" />
            <input type="button" disabled={this.state.stopSimulation} onClick={this.nextTrainStep.bind(this)} value="Next Train Step" />
            <HighCharts config={this.getErrorConfig()} />
        </div>
    }
}
