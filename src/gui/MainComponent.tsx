import * as React from 'react'
import {Simulation} from './Simulation'
import { Point } from "../math";
import { Dock, World } from "../model/world";
import {Emulator} from './Emulator';
import {Tab, Tabs} from 'react-bootstrap';
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
                    <Tabs id={"2"} defaultActiveKey={1} animation={false}>
                        <Tab eventKey={1} title={"How it works"}>
                            <HowItWorks />
                        </Tab>
                        <Tab eventKey={2} title={"Step 1: Emulator"}>
                            <Emulator object={this.getObject()} onNetworkChange={this.onEmulatorNetworkChanged.bind(this)} />                            
                        </Tab>
                        <Tab eventKey={3} title={"Step 2: Controller"}>
                            <Controller onControllerTrained={this.onControllerNetChanged.bind(this)} emulatorNet={this.state.emulatorNet} world={controllerWorld} object={controllerTruck} />
                        </Tab>
                    </Tabs>
                </div>

            </div>
    }
}