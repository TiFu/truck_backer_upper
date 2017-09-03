import * as React from 'react'
import * as $ from "jquery";
import { Layer, Rect, Stage, Group, Line, Circle} from 'react-konva'
import { World, Dock} from './model/world'
import {Point, plus, scale, minus, calculateVector, Angle, rotate} from './math'
import {Truck} from './model/truck'
import {TruckTrailerVisualization} from './TruckTrailerVisualization'
import {WheelVisualization} from './WheelVisualization'

import {DockVisualization} from './DockVisualization'
import {CoordinateSystemTransformation} from './CoordinateSystemTransformation'
import {Vector} from './math'

export default class WorldVisualization extends React.Component<{ world: World}, {}> {
    canvasWidth: number
    canvasHeight: number

    public constructor(props: { world: World}) {
        super(props);
        this.canvasWidth = 1600
        this.canvasHeight = 800
    }

    componentDidMount() {

    }

    componentDidUpdate() {

    }

    public render() {
        let cst = new CoordinateSystemTransformation(15, new Vector(this.canvasWidth * 1 / 4.0, this.canvasHeight / 2.0));

        return <Stage width={this.canvasWidth} height={this.canvasHeight}>
                        <Layer>
                            <DockVisualization cordSystemTransformer={cst} dock={this.props.world.dock} canvasWidth={this.canvasWidth} canvasHeight={this.canvasHeight} />
                            <TruckTrailerVisualization cordSystemTransformer={cst} truck={this.props.world.truck}/>
                        </Layer>
                    </Stage>
    }
}