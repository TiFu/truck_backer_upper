declare var require: any; // trust me require exists
import * as React from 'react'
import WorldVisualization from "./WorldVisualization"
import {World} from '../model/world'
import {TrainTruckEmulator, TrainController} from '../neuralnet/train'
import {emulatorNet, controllerNet, carControllerNet} from '../neuralnet/implementations'
import {Point, Vector, scalarProduct} from '../math'
const HighCharts = require("react-highcharts");
import {LessonView} from '../gui/LessonView'
import {createCarControllerLessons, createCarJacobianLessons, Lesson} from '../neuralnet/lesson'
import { TruckControllerError } from '../neuralnet/error';
import {NormalizedTruck} from '../model/truck';
import {NeuralNetEmulator} from '../neuralnet/emulator';
import { NormalizedCar, CarEmulator } from '../model/car';
import {CarControllerError} from '../neuralnet/error';
import {Car} from '../model/car';
import {Truck} from '../model/truck';
import {Dock} from '../model/world';

let lessons: Array<Lesson> = [];

interface SimulationProps {
    object: Car | Truck;
    dock: Dock;
}
interface SimulationState {
     world: World;
     steeringSignal: number;
     simulationSpeed: number;
     driveButtonDisabled: boolean;
}

export default class Simulation extends React.Component<SimulationProps, SimulationState> {
    static instance: Simulation;
    private lastTimestamp: number = -1;
    private stepLengthInMs = 1000;

    public constructor(props: SimulationProps) {
        super(props)
        if (Simulation.instance) throw Error("Already instantiated")
        else Simulation.instance = this;
        this.state = {
            world: new World(this.props.object, this.props.dock), 
            steeringSignal: 0, 
            simulationSpeed: 1,
            driveButtonDisabled: false
        };
    }

    public drive(steeringSignal: number, done: (cont: boolean) => void) {
        this.setState({driveButtonDisabled: true});
        this.lastTimestamp = performance.now();
        const callback = (cont: boolean) => {
            this.setState({driveButtonDisabled: false});
            done(cont);
        }
        window.requestAnimationFrame(this.driveFrameCallback(steeringSignal, 0, callback));
    }

    private driveFrameCallback = (steeringSignal: number, totalTime: number, done: (cont: boolean) => void) => {
        return (timestamp: number) => this.driveStep(timestamp, steeringSignal, totalTime, done);
    };

    private driveStep(timestamp: number, steeringSignal: number, totalTime: number, done: (cont:boolean) => void) {
        const stepLength = this.stepLengthInMs / this.state.simulationSpeed;
        const delta = (timestamp - this.lastTimestamp);
        const realDelta = this.state.simulationSpeed * Math.min(stepLength - totalTime, delta);

        const cont = this.state.world.nextTimeStep(steeringSignal, realDelta / this.stepLengthInMs);
        totalTime += delta;
        this.onFrame(true);

        if (totalTime < stepLength && cont) {
            this.lastTimestamp = performance.now();
            window.requestAnimationFrame(this.driveFrameCallback(steeringSignal, totalTime, done));
        } else {
            done(cont);
        }
    }

    public onFrame(forceRedraw: boolean) {
        if (forceRedraw)
            this.forceUpdate();
        
    }

    private handleDriveButton(e: any) {
        this.drive(0.5, () => {});
    }

    public render() {
        return <div>
            <WorldVisualization world={this.state.world} />
            <input type="button" value="Drive" disabled={this.state.driveButtonDisabled} onClick={this.handleDriveButton.bind(this)} />
        </div>
    }
}
