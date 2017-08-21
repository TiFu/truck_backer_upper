import * as React from 'react'
import {Truck} from './model/truck'
import {CoordinateSystemTransformation} from './CoordinateSystemTransformation';
import { Layer, Rect, Stage, Group, Line, Circle} from 'react-konva'
import {plus, Point, minus, calculateVector, scale} from './math'
import {BoxVisualization} from './BoxVisualization'
import {WheelVisualization} from './WheelVisualization'

interface TrailerVisualizationProps {
     truck: Truck;
     wheelOffset: number;
     cordSystemTransformer: CoordinateSystemTransformation
}
export class TrailerVisualization extends React.Component<TrailerVisualizationProps, {}> {

    public constructor(props: TrailerVisualizationProps) {
        super(props)
    }
    public map(b: Point) { 
        let n =  this.props.cordSystemTransformer.mapIntoNewCordSystem(b);
        return n;
    }

    public render() {
        let eot = this.props.truck.trailerEndPosition;
        let cfp = this.props.truck.couplingDevicePosition;
        let mappedEot = this.map(eot);
        let mappedCfp = this.map(cfp);
        return <Group>
            <BoxVisualization points={this.props.truck.getTrailerCorners()} cordSystemTransformer={this.props.cordSystemTransformer} />
            <Circle radius={3} x={mappedEot.x} y={mappedEot.y} fill="black" />
            <Circle radius={3} x={mappedCfp.x} y={mappedCfp.y} fill="black" />
            <WheelVisualization cordSystemTransformer={this.props.cordSystemTransformer} basePoint={eot} pointA={eot} pointB={cfp} wheelLength={1} wheelOffset={this.props.wheelOffset} boxWidth={this.props.truck.getWidth()} />
        </Group>
    }
}