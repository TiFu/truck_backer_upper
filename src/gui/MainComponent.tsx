import * as React from 'react'
import {Simulation} from './Simulation'
import { Car, NormalizedCar } from "../model/car";
import { Point } from "../math";
import { Dock, World } from "../model/world";
import {Emulator} from './Emulator';
import {Tab, Tabs} from 'react-bootstrap';
import {Controller} from './Controller';
import {NeuralNet} from '../neuralnet/net';
import { TrainController } from '../neuralnet/train';
import{Truck, NormalizedTruck} from '../model/truck';

export interface MainComponentState {
    emulatorNet: NeuralNet;
    controller: TrainController;
    simulationCar: Car | Truck;
}
export class MainComponent extends React.Component<{}, MainComponentState> {
    private controllerRef: any;

    public constructor(props: {}) {
        super(props)
        this.state = {emulatorNet: undefined, controller: undefined, simulationCar: new Car(new Point(15, 15), 0, [])};
    }

    private toDeg(radians: number): number {
        return radians / Math.PI * 180;
    }

    private onEmulatorNetworkChanged(nn: NeuralNet) {
        this.setState({emulatorNet: nn});
    }

    private onControllerNetChanged(controller: TrainController) {
        if (this.state.simulationCar instanceof Car) {
            controller.setPlant(new NormalizedCar(this.state.simulationCar));
        } else {
            controller.setPlant(new NormalizedTruck(this.state.simulationCar));            
        }
        this.setState({controller: controller});
    }

    public render() {
        let controllerCar = new Car(new Point(15,15), 0, []);
        let controllerWorld = new World(controllerCar, new Dock(new Point(0, 0)));

        return <div className="container">
                <div className="page-header">
                    <h1>Truck Backer Upper</h1>
                </div>
                <div className="row">
                    <div className="col-sm-12">
                        <Simulation controller={this.state.controller} object={this.state.simulationCar} dock={new Dock(new Point(0,0))} />
                    </div>
                </div>
                <div className="row">
                    <Tabs id={"2"} defaultActiveKey={1} animation={false}>
                        <Tab eventKey={1} title={"Emulator"}>
                            <Emulator object={new Car(new Point(15,15), 0, [])} onNetworkChange={this.onEmulatorNetworkChanged.bind(this)} />                            
                        </Tab>
                        <Tab eventKey={2} title={"Controller"}>
                            <Controller onControllerTrained={this.onControllerNetChanged.bind(this)} emulatorNet={this.state.emulatorNet} world={controllerWorld} object={controllerCar} />
                        </Tab>
                    </Tabs>
                </div>

            </div>
    }
}