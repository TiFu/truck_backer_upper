import * as React from 'react'
import {Simulation} from './Simulation'
import { Point } from "../math";
import { Dock, World } from "../model/world";
import {Emulator} from './Emulator';
import {Controller} from './Controller';
import {NeuralNet} from '../neuralnet/net';
import { TrainController } from '../neuralnet/train';
import{Truck, NormalizedTruck} from '../model/truck';
import {HowItWorks} from './HowItWorks';

export interface MainComponentState {
    emulatorNet: NeuralNet;
    controller: TrainController;
    truck: Truck;
}
export class MainComponent extends React.Component<{}, MainComponentState> {
    private controllerRef: any;

    public constructor(props: {}) {
        super(props)
        this.state = {emulatorNet: undefined, controller: undefined, truck: new Truck(new Point(15, 15), 0, 0, new Dock(new Point(0,0)), [])};
    }

    private toDeg(radians: number): number {
        return radians / Math.PI * 180;
    }

    private onEmulatorNetworkChanged(nn: NeuralNet) {
        this.setState({emulatorNet: nn});
    }

    private onControllerNetChanged(controller: TrainController) {
        if (controller != null) {
            controller.setPlant(new NormalizedTruck(this.state.truck));            
        }
        this.setState({controller: controller});
    }

    public getObject(): Truck {
        return new Truck(new Point(15, 15), 0, 0, new Dock(new Point(0,0)), [])
    }

    public render() {
        let controllerTruck = this.getObject();
        let controllerWorld = new World(controllerTruck, new Dock(new Point(0, 0)));

        return <div className="container">
                <div className="page-header">
                    <h1>{"Nguyen & Widrow's "} Truck Backer Upper</h1>
                </div>
                <div className="row">
                    <div className="col-sm-12">
                        <Simulation controller={this.state.controller} object={this.state.truck} dock={new Dock(new Point(0,0))} />
                    </div>
                </div>
                <div className="row">
                    <div className="col-12">
                        <ul className="nav nav-tabs">
                            <li className="nav-item">
                                <a className="nav-link active" data-toggle="tab" href="#how_it_works">How it works</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" data-toggle="tab" href="#emulator">Step 1: Emulator</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" data-toggle="tab" href="#controller">Step 2: Controller</a>
                            </li>
                        </ul>

                        <div className="tab-content">
                            <div className="tab-pane active container" id="how_it_works"><HowItWorks /></div>
                            <div className="tab-pane container" id="emulator">
                                <Emulator object={this.getObject()} onNetworkChange={this.onEmulatorNetworkChanged.bind(this)} />
                            </div>
                            <div className="tab-pane container" id="controller">
                                <Controller onControllerTrained={this.onControllerNetChanged.bind(this)} emulatorNet={this.state.emulatorNet} world={controllerWorld} object={controllerTruck} />
                            </div>
                        </div> 
                    </div>
                </div>
                <a href="https://github.com/TiFu/truck_backer_upper">Source on Github</a>
            </div>
    }
}