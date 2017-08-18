import * as React from 'react'
import {Truck} from './model/truck'
import {CoordinateSystemTransformation} from './CoordinateSystemTransformation';
import { Layer, Rect, Stage, Group, Line, Circle} from 'react-konva'
import {plus, minus, calculateVector, scale} from './math'
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

    public render() {
        let eot = this.props.truck.trailerEndPosition;
        let cfp = this.props.truck.couplingDevicePosition;

        return <Group>
            <BoxVisualization pointA={eot} pointB={cfp} width={this.props.truck.getWidth()} cordSystemTransformer={this.props.cordSystemTransformer} />
            <WheelVisualization cordSystemTransformer={this.props.cordSystemTransformer} basePoint={eot} pointA={eot} pointB={cfp} wheelLength={1} wheelOffset={this.props.wheelOffset} boxWidth={this.props.truck.getWidth()} />
        </Group>
    }
}