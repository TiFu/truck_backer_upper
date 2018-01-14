import * as React from 'react'
import {Truck} from './model/truck'
import {CoordinateSystemTransformation} from './CoordinateSystemTransformation';
import { Layer, Rect, Stage, Group, Line, Circle} from 'react-konva'
import {plus, minus, calculateVector, scale, Point} from './math'
import {BoxVisualization} from './BoxVisualization'
import {WheelVisualization} from './WheelVisualization'

interface TruckVisualizationProps {
     truck: Truck;
     wheelOffset: number;
     cordSystemTransformer: CoordinateSystemTransformation
}
export class TruckVisualization extends React.Component<TruckVisualizationProps, {}> {

    public constructor(props: TruckVisualizationProps) {
        super(props)
    }
    
    public map(b: Point) { 
        let n =  this.props.cordSystemTransformer.mapIntoNewCordSystem(b);
        return n;
    }

    public render() {
        let eot = this.props.truck.getEndOfTruck();
        let cfp = this.props.truck.getCabinFrontPosition();
        let mappedEOT = this.map(eot);
        let mappedCFP = this.map(cfp);
        return <Group>
            <BoxVisualization points={this.props.truck.getTruckCorners()} cordSystemTransformer={this.props.cordSystemTransformer} />
            <WheelVisualization cordSystemTransformer={this.props.cordSystemTransformer} basePoint={eot} pointA={eot} pointB={cfp} wheelLength={1} wheelOffset={this.props.wheelOffset} boxWidth={this.props.truck.getWidth()} />
            <WheelVisualization cordSystemTransformer={this.props.cordSystemTransformer} basePoint={cfp} pointA={cfp} pointB={eot} wheelLength={1} wheelOffset={this.props.wheelOffset} boxWidth={this.props.truck.getWidth()} steeringAngle={- this.props.truck.getLastSteeringAngle()} />
            <Circle radius={3} x={mappedEOT.x} y={mappedEOT.y} fill="black" />
            <Circle radius={3} x={mappedCFP.x} y={mappedCFP.y} fill="black" />
        </Group>
    }
}