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
        this.canvasWidth = 800
        this.canvasHeight = 800
    }

    componentDidMount() {

    }

    componentDidUpdate() {

    }

    public mapPointToCanvas(point: Point) {
        return new Point(10 *point.x + this.canvasWidth * 1/4., this.canvasHeight - (10 * point.y + this.canvasHeight / 2))
    }  

    public mapPointToWorld(point: Point) {
        return new Point(point.x / 10 - this.canvasWidth * 1 /4, this.canvasHeight + point.y / 10 - this.canvasHeight / 2)
    }

    public render() {
        let cst = new CoordinateSystemTransformation(10, new Vector(this.canvasWidth * 1 / 40., this.canvasHeight / 2.0));
//        <TruckTrailerVisualization cordSystemTransformer={cst} truck={this.props.world.truck}/>
//        <DockVisualization cordSystemTransformer={cst} dock={this.props.world.dock} canvasWidth={this.canvasWidth} canvasHeight={this.canvasHeight} />

        return <Stage width={this.canvasHeight} height={this.canvasWidth}>
                        <Layer>
                            <WheelVisualization cordSystemTransformer={cst} pointA={new Point(0,0)} pointB={new Point(0,1)} basePoint={new Point(0, 0)} boxWidth={1} wheelLength={1} wheelOffset={0.1} />
                        </Layer>
                    </Stage>
    }
}