import * as React from 'react'
import {Simulation} from './Simulation'
import { Car } from "../model/car";
import { Point } from "../math";
import { Dock } from "../model/world";


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
            </div>
    }
}