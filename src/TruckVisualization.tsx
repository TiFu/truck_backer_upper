import * as React from 'react'
import {Truck} from './model/truck'
import {CoordinateSystemTransformation} from './CoordinateSystemTransformation';
import { Layer, Rect, Stage, Group, Line, Circle} from 'react-konva'
import {plus, minus, calculateVector, scale} from './math'
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

    public render() {
        let eot = this.props.truck.getEndOfTruck();
        let cfp = this.props.truck.cabinFrontPosition;

        return <Group>
            <BoxVisualization pointA={eot} pointB={cfp} width={this.props.truck.getWidth()} cordSystemTransformer={this.props.cordSystemTransformer} />
            <WheelVisualization cordSystemTransformer={this.props.cordSystemTransformer} basePoint={eot} pointA={eot} pointB={cfp} wheelLength={0.2} wheelOffset={this.props.wheelOffset} boxWidth={this.props.truck.getWidth()} />
            <WheelVisualization cordSystemTransformer={this.props.cordSystemTransformer} basePoint={cfp} pointA={eot} pointB={cfp} wheelLength={1} wheelOffset={this.props.wheelOffset} boxWidth={this.props.truck.getWidth()} steeringAngle={this.props.truck.getSteeringAngle()} />
        </Group>
    }
}