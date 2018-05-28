import * as React from 'react'
import * as $ from "jquery";
import { Layer, Rect, Stage, Group, Line, Circle} from 'react-konva'
import { World, Dock} from './model/world'
import {Point, plus, scale, minus, calculateVector, Angle, rotate, StraightLine} from './math'
import {Truck} from './model/truck'
import {TruckTrailerVisualization} from './TruckTrailerVisualization'
import {WheelVisualization} from './WheelVisualization'
import {StraightLineVisualization} from './StraightLineVisualization'
import {CarVisualization} from './CarVisualization'

import {DockVisualization} from './DockVisualization'
import {CoordinateSystemTransformation} from './CoordinateSystemTransformation'
import {Vector} from './math'
import { Car } from './model/car';

export default class WorldVisualization extends React.Component<{ world: World, intermediateCarPositions?: Array<number[]>}, {}> {
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
        let cst = new CoordinateSystemTransformation(15, 15, new Vector(this.canvasWidth * 1 / 4.0, this.canvasHeight / 2.0));
        let limitVis = [];
        let limits = this.props.world.getLimits();
        for (let i = 0; i < limits.length; i++) {
            let line = limits[i];
            limitVis.push(<StraightLineVisualization key={i} line={line} cordSystemTransformer={cst} canvasHeight={this.canvasHeight} canvasWidth={this.canvasWidth} />)
        }
        let cars: Array<JSX.Element> = [];
        if (this.props.intermediateCarPositions !== undefined) {
            cars = this.props.intermediateCarPositions.map(p => new Car(new Point(p[0], p[1]), p[2])).map(c => <CarVisualization cordSystemTransformer={cst} color="green" car={c} wheelOffset={0.2} />).filter((element, index) => index % 1 == 0);
        }

        return <Stage width={this.canvasWidth} height={this.canvasHeight}>
                        <Layer>
                            {limitVis}
                            <DockVisualization cordSystemTransformer={cst} dock={this.props.world.dock} canvasWidth={this.canvasWidth} canvasHeight={this.canvasHeight} />
                            <TruckTrailerVisualization cordSystemTransformer={cst} truck={this.props.world.truck}/>
                            <CarVisualization cordSystemTransformer={cst} car={this.props.world.car} wheelOffset={0.2} />
                            {cars}
                        </Layer>
                    </Stage>
    }
}