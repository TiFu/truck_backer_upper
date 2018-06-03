import * as React from 'react'
import * as $ from "jquery";
import { Layer, Rect, Stage, Group, Line, Circle, Text} from 'react-konva'
import { World, Dock} from '../model/world'
import {Point, plus, scale, minus, calculateVector, Angle, rotate, StraightLine} from '../math'
import {Truck} from '../model/truck'
import {TruckTrailerVisualization} from './TruckTrailerVisualization'
import {WheelVisualization} from './WheelVisualization'
import {StraightLineVisualization} from './StraightLineVisualization'
import {CarVisualization} from './CarVisualization'

import {DockVisualization} from './DockVisualization'
import {CoordinateSystemTransformation} from './CoordinateSystemTransformation'
import {Vector} from '../math'
import { Car } from '../model/car';

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

    private visualizeMovableObject(movableObject: any, cst: CoordinateSystemTransformation) {
        if (this.props.world.movableObject instanceof Truck) {
            return <TruckTrailerVisualization cordSystemTransformer={cst} truck={movableObject}/>;
        } else if (this.props.world.movableObject instanceof Car) {
            return <CarVisualization cordSystemTransformer={cst} car={movableObject} wheelOffset={0.2} />
        } else {
            return <Text text="Unknown movable object!" />;
        }

    }
    public render() {
        let cst = new CoordinateSystemTransformation(15, 15, new Vector(this.canvasWidth * 1 / 4.0, this.canvasHeight / 2.0));
        let limitVis = [];
        let limits = this.props.world.getLimits();
        for (let i = 0; i < limits.length; i++) {
            let line = limits[i];
            limitVis.push(<StraightLineVisualization key={i} line={line} cordSystemTransformer={cst} canvasHeight={this.canvasHeight} canvasWidth={this.canvasWidth} />)
        }

        let movableObjectVisualization = this.visualizeMovableObject(this.props.world.movableObject, cst);
        return <Stage width={this.canvasWidth} height={this.canvasHeight}>
                        <Layer>
                            {limitVis}
                            <DockVisualization cordSystemTransformer={cst} dock={this.props.world.dock} canvasWidth={this.canvasWidth} canvasHeight={this.canvasHeight} />
                            {movableObjectVisualization}
                        </Layer>
                    </Stage>
    }
}