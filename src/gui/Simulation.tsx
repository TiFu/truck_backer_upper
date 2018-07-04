declare var require: any; // trust me require exists
import * as React from 'react'
import WorldVisualization from "./WorldVisualization"
import { World } from '../model/world'
import { toDeg, toRad } from '../math';
import { TrainController } from '../neuralnet/train'
import { Point } from '../math'
import { Truck } from '../model/truck';
import { Dock } from '../model/world';
import Slider from 'rc-slider';


interface SimulationProps {
    object: Truck;
    dock: Dock;
    controller: TrainController;
}
interface SimulationState {
    world: World;
    steeringSignal: number;
    simulationSpeed: number;
    isDriving: boolean;
    cabAngle: number;
    trailerAngle: number;
}

export class Simulation extends React.Component<SimulationProps, SimulationState> {
    static instance: Simulation;
    private lastTimestamp: number = -1;
    private stepLengthInMs = 1000;

    public constructor(props: SimulationProps) {
        super(props)
        if (Simulation.instance) throw Error("Already instantiated")
        else Simulation.instance = this;

        let cabAngle = undefined;
        let trailerAngle = undefined;
        if (this.props.object instanceof Truck) {
            cabAngle = toDeg(this.props.object.getTruckAngle());
            trailerAngle = toDeg(this.props.object.getTrailerAngle());
        }
        this.state = {
            world: new World(this.props.object, this.props.dock),
            steeringSignal: 0,
            simulationSpeed: 4,
            isDriving: false,
            cabAngle: cabAngle,
            trailerAngle: trailerAngle
        };
    }

    public drive(steeringSignal: number, done: (cont: boolean) => void) {
        this.setState({ isDriving: true });
        this.lastTimestamp = performance.now();
        const callback = (cont: boolean) => {
            if (cont) {
                done(cont);
            } else {
                this.setState({ isDriving: false }, () => {
                    done(cont);
                });
            }
        }
        window.requestAnimationFrame(this.driveFrameCallback(steeringSignal, 0, callback));
    }

    private driveFrameCallback = (steeringSignal: number, totalTime: number, done: (cont: boolean) => void) => {
        return (timestamp: number) => this.driveStep(timestamp, steeringSignal, totalTime, done);
    };

    private driveStep(timestamp: number, steeringSignal: number, totalTime: number, done: (cont: boolean) => void) {
        const stepLength = this.stepLengthInMs / this.state.simulationSpeed;
        const delta = (timestamp - this.lastTimestamp);
        const realDelta = this.state.simulationSpeed * Math.min(stepLength - totalTime, delta);

        const cont = this.state.world.nextTimeStep(steeringSignal, realDelta / this.stepLengthInMs);
        totalTime += delta;
        this.onFrame(true);

        if (totalTime < stepLength && cont && this.state.isDriving) {
            this.lastTimestamp = performance.now();
            window.requestAnimationFrame(this.driveFrameCallback(steeringSignal, totalTime, done));
        } else {
            done(cont && this.state.isDriving);
        }
    }

    public onFrame(forceRedraw: boolean) {
        if (forceRedraw)
            this.forceUpdate();

    }

    private handleDriveButton() {
        this.drive(this.state.steeringSignal, (cont: boolean) => { this.setState({ isDriving: !cont }) });
    }
    private handleSteeringSignalChanged(value: number) {
        this.setState({ steeringSignal: value })
    }
    private handleSimulationSpeedChanged(value: number) {
        this.setState({ simulationSpeed: value });
    }

    private handleSetRandomPosition() {
        this.state.world.movableObject.randomizePosition();
        //        this.forceUpdate();
        this.setState({ isDriving: false })
    }

    private handleDriveController() {
        let steeringSignal = this.props.controller.predict();
        this.drive(steeringSignal, (cont: boolean) => {
            if (cont) {
                this.handleDriveController();
            }
        })
    }

    private getTruckAngleSettings() {
        return <div className="form-group">
            <div className="form-inline">
                <div className="row mb w-100">
                    <div className="col-6">
                        <label htmlFor="formGroupExampleInput" className="float-left">Trailer Angle</label>
                    </div>
                    <div className="col-6">
                        <input defaultValue={toDeg(this.props.object.getTrailerAngle()).toString()} id="learningRate" type="text" onBlur={(e) => this.handleTrailerAngleChanged(e)} className="form-control ml float-right" />
                    </div>
                </div>
            </div>
            <div className="form-inline">
                <div className="row mb w-100">
                    <div className="col-6">
                        <label htmlFor="formGroupExampleInput" className="float-left">Cabin Angle (rel. to Trailer)</label>
                    </div>
                    <div className="col-6">
                        <input defaultValue={toDeg(this.props.object.getTruckAngle()).toString()} id="learningRate" type="text" onBlur={(e) => this.handleCabinAngleChanged(e)} className="form-control ml float-right" />
                    </div>
                </div>
            </div>
            <div className="form-inline">
                <div className="row w-100">
                    <div className="col-12">
                        <button type="button" className="btn btn-primary float-right" disabled={this.state.isDriving} onClick={this.handleChangeTruckAngle.bind(this)} >Change Angles</button>
                    </div>
                </div>
            </div>
        </div>
    }

    private handleChangeTruckAngle() {
        if (this.props.object instanceof Truck) {
            this.props.object.setTruckPosition(
                this.props.object.getTrailerEndPosition(),
                toRad(this.state.trailerAngle),
                toRad(this.state.trailerAngle + Math.max(-90, Math.min(this.state.cabAngle, 90)))
            )
            this.forceUpdate();
        }
    }

    private handleTrailerAngleChanged(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
            trailerAngle: Number.parseFloat(e.currentTarget.value)
        })
    }

    private handleCabinAngleChanged(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
            cabAngle: Number.parseFloat(e.currentTarget.value)
        })
    }

    private handlePositionChange(translation: Point) {
        let truck = this.props.object;
        let tep = truck.getTrailerEndPosition();
        let oldTep = new Point(tep.x, tep.y);
        tep.x += translation.x;
        tep.y += translation.y;
        this.props.object.setTruckPosition(tep, truck.getTrailerAngle(), truck.getTruckAngle());
        this.forceUpdate();
    }

    public handleStopDriving() {
        this.setState({ isDriving: false })
    }
    public render() {
        let marksSteering: any = {};
        for (let i = -1; i <= 1; i += 0.2) {
            marksSteering[i] = "" + (this.state.world.movableObject.getMaxSteeringAngle() * i * 180 / Math.PI).toFixed(2);
        }
        let marksSimulationSpeed: any = { 1: "1", 2: "2" };
        let maxSimSpeed = 64;
        for (let i = 4; i <= maxSimSpeed; i += 4) {
            marksSimulationSpeed[i] = "" + i.toFixed(0);
        }
        return <div>
            <div className="container">
                <div className="row">
                    <div className="col-sm-6 pad">
                        <div className="col-sm-12 panel panel-default">
                            <WorldVisualization draggable={!this.state.isDriving} world={this.state.world} onObjectMoved={this.handlePositionChange.bind(this)} />
                        </div>
                    </div>
                    <div className="col-sm-6 pad">
                        <div className="row">
                            <div className="col-sm-12 panel panel-default h-100">
                                <h3>Simulation Settings</h3>
                                <div className="form-group pad-slider">
                                    <label htmlFor="formGroupExampleInput">Steering Angle (in Degree)</label>
                                    <Slider min={-1} max={1} marks={marksSteering} onChange={this.handleSteeringSignalChanged.bind(this)} value={this.state.steeringSignal} step={0.05} />
                                </div>
                                <div className="form-group pad-slider">
                                    <label htmlFor="formGroupExampleInput">Simulation Speed</label>
                                    <Slider min={1} max={maxSimSpeed} marks={marksSimulationSpeed} onChange={this.handleSimulationSpeedChanged.bind(this)} value={this.state.simulationSpeed} step={1} />
                                </div>
                                <div className="h3 btn-toolbar">
                                    <button type="button" className="btn btn-primary" disabled={this.state.isDriving} onClick={this.handleDriveButton.bind(this)} >Manual Drive</button>
                                    <button type="button" className="btn btn-warning" onClick={this.handleSetRandomPosition.bind(this)}>Random Position</button>
                                    <button type="button" className="btn btn-primary" disabled={!this.props.controller || this.state.isDriving} onClick={this.handleDriveController.bind(this)}>Drive using Controller</button>
                                    <button type="button" className="btn btn-danger" disabled={!this.state.isDriving} onClick={this.handleStopDriving.bind(this)}>Stop</button>
                                </div>
                                <h3>Truck Orientation</h3>
                                <div className="alert alert-info">
                                    Drag & Drop the truck to change its position, then set the angles here. Cabin Angle must be less than +/- 90 degrees
                                </div>
                                {this.getTruckAngleSettings()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}
