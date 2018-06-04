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
    private static idCounter = 1;
    canvasWidth: number
    canvasHeight: number
    private internalWidth: number = 110;
    private internalHegiht: number = 110;
    private id: number;

    public constructor(props: { world: World}) {
        super(props);
        this.canvasWidth = 500
        this.canvasHeight = 400
        this.id = WorldVisualization.idCounter;
        WorldVisualization.idCounter++;
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

    public onResize(contentRect: any) {
        const {width, height} = contentRect;

    }
    public render() {
        let widthScale = this.canvasWidth / this.internalWidth;
        let heigthScale = this.canvasHeight / this.internalHegiht;
        let scale = Math.min(widthScale, heigthScale);
        // TODO: calculate scale based on canvasWidth/Height & area to be shown... 
        // simple
        let cst = new CoordinateSystemTransformation(scale, scale, new Vector(this.canvasWidth * 1 / 16.0, this.canvasHeight / 2.0));
        let limitVis = [];
        let limits = this.props.world.getLimits();
        for (let i = 0; i < limits.length; i++) {
            let line = limits[i];
            limitVis.push(<StraightLineVisualization key={i} line={line} cordSystemTransformer={cst} canvasHeight={this.canvasHeight} canvasWidth={this.canvasWidth} />)
        }
        
        let movableObjectVisualization = this.visualizeMovableObject(this.props.world.movableObject, cst);
        return <div id={"stageContainer" + this.id}>
                <Stage scaleX={1} scaleY={1} width={this.canvasWidth} height={this.canvasHeight} className="drawingArea">
                        <Layer>
                            {limitVis}
                            <DockVisualization cordSystemTransformer={cst} dock={this.props.world.dock} canvasWidth={this.canvasWidth} canvasHeight={this.canvasHeight} />
                            {movableObjectVisualization}
                        </Layer>
                    </Stage>
                </div>
    }
}