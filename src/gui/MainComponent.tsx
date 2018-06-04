import * as React from 'react'
import {Simulation} from './Simulation'
import { Car } from "../model/car";
import { Point } from "../math";
import { Dock } from "../model/world";
import {Emulator} from './Emulator';
import {Tab, Tabs} from 'react-bootstrap';

export class MainComponent extends React.Component<{}, {}> {

    public constructor(props: {}) {
        super(props)
    }

    private toDeg(radians: number): number {
        return radians / Math.PI * 180;
    }

    public render() {
        return <div className="container">
                <div className="page-header">
                    <h1>Truck Backer Upper</h1>
                </div>
                <div className="row">
                    <div className="col-sm-12">
                        <Simulation object={new Car(new Point(15, 15), 0, [])} dock={new Dock(new Point(0,0))} />
                    </div>
                </div>
                <div className="row">
                    <Tabs id={"2"} defaultActiveKey={1} animation={false}>
                        <Tab eventKey={1} title={"Emulator"}>
                            <Emulator object={new Car(new Point(15,15), 0, [])} />                            
                        </Tab>
                        <Tab eventKey={2} title={"Controller"}>
                            Nothing to see yet
                        </Tab>
                    </Tabs>
                </div>

            </div>
    }
}