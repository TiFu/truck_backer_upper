declare var require: any; // trust me require exists
import * as React from 'react'
import WorldVisualization from "./WorldVisualization"
import {World} from '../model/world'
import {TrainTruckEmulator, TrainController} from '../neuralnet/train'
import {emulatorNet, controllerNet, carControllerNet} from '../neuralnet/implementations'
import {Point, Vector, scalarProduct} from '../math'
const HighCharts = require("react-highcharts");
import {createCarControllerLessons, createCarJacobianLessons, Lesson} from '../neuralnet/lesson'
import { TruckControllerError } from '../neuralnet/error';
import {NormalizedTruck} from '../model/truck';
import {NeuralNetEmulator} from '../neuralnet/emulator';
import { NormalizedCar, CarEmulator } from '../model/car';
import {CarControllerError} from '../neuralnet/error';
import {Car} from '../model/car';
import {Truck} from '../model/truck';
import {Dock} from '../model/world';
import Slider from 'rc-slider';


interface SimulationProps {
    object: Car | Truck;
    dock: Dock;
    controller: TrainController;
}
interface SimulationState {
     world: World;
     steeringSignal: number;
     simulationSpeed: number;
     driveButtonDisabled: boolean;
}

export class Simulation extends React.Component<SimulationProps, SimulationState> {
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
            simulationSpeed: 4,
            driveButtonDisabled: false
        };
    }

    public drive(steeringSignal: number, done: (cont: boolean) => void) {
        this.setState({driveButtonDisabled: true});
        this.lastTimestamp = performance.now();
        const callback = (cont: boolean) => {
            console.log("[Truck Driving] ", cont);
            if (cont) {
                done(cont);
            } else {
                this.setState({driveButtonDisabled: false}, () => {
                    done(cont);
                });    
            }
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

        if (totalTime < stepLength && cont && this.state.driveButtonDisabled) {
            this.lastTimestamp = performance.now();
            window.requestAnimationFrame(this.driveFrameCallback(steeringSignal, totalTime, done));
        } else {
            done(cont && this.state.driveButtonDisabled);
        }
    }

    public onFrame(forceRedraw: boolean) {
        if (forceRedraw)
            this.forceUpdate();
        
    }

    private handleDriveButton(e: any) {
        this.drive(this.state.steeringSignal, (cont: boolean) => { this.setState({driveButtonDisabled: !cont}) });
    }
    private handleSteeringSignalChanged(value: number) {
        this.setState({steeringSignal: value})
    }
    private handleSimulationSpeedChanged(value: number) {
        this.setState({simulationSpeed: value});
    }

    private handleSetRandomPosition(e: any) {
        this.state.world.movableObject.randomizePosition();
//        this.forceUpdate();
        this.setState({driveButtonDisabled: false})
    }

    private handleDriveController() {
        let steeringSignal = this.props.controller.predict();
        this.drive(steeringSignal, (cont: boolean) => {
            if (cont) {
                this.handleDriveController();
            } else {
                console.log(this.props.object.getStateVector());
            }
        })
    }

    public render() {
        let marksSteering: any = {};
        for (let i = -1; i <= 1; i += 0.2) {
            marksSteering[i] = "" + (this.state.world.movableObject.getMaxSteeringAngle() * i * 180 / Math.PI).toFixed(2) ;
        }
        let marksSimulationSpeed: any = { 1: "1", 2: "2"};
        let maxSimSpeed = 64;
        for (let i = 4; i <= maxSimSpeed; i += 4) {
            marksSimulationSpeed[i] = "" + i.toFixed(0);
        }
        return <div>
            <div className="container">
                <div className="row">
                    <div className="col-sm-6 pad">
                        <div className="col-sm-12 panel panel-default">
                            <WorldVisualization world={this.state.world} />
                        </div>
                    </div>
                    <div className="col-sm-6 pad">
                        <div className="row">
                            <div className="col-sm-12 panel panel-default h-100">
                                <h3>Simulation Settings</h3>
                                <div className="form-group pad-slider">
                                    <label htmlFor="formGroupExampleInput">Steering Angle (in Degree)</label>
                                    <Slider min={-1} max={1} marks={marksSteering}onChange={this.handleSteeringSignalChanged.bind(this)} value={this.state.steeringSignal} step={0.05} />
                                </div>
                                <div className="form-group pad-slider">
                                    <label htmlFor="formGroupExampleInput">Simulation Speed</label>
                                    <Slider min={1} max={maxSimSpeed} marks={marksSimulationSpeed}onChange={this.handleSimulationSpeedChanged.bind(this)} value={this.state.simulationSpeed} step={1} />
                                </div>
                                <div className="h3 btn-toolbar">
                                    <button type="button" className="btn btn-primary" disabled={this.state.driveButtonDisabled} onClick={this.handleDriveButton.bind(this)} >Manual Drive</button>
                                    <button type="button" className="btn btn-warning" onClick={this.handleSetRandomPosition.bind(this)}>Random Position</button>
                                    <button type="button" className="btn btn-primary" disabled={!this.props.controller || this.state.driveButtonDisabled} onClick={this.handleDriveController.bind(this)}>Drive using Controller</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}
