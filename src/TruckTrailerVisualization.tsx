import * as React from 'react'
import {Truck} from './model/truck'
import {CoordinateSystemTransformation} from './CoordinateSystemTransformation';
import { Layer, Rect, Stage, Group, Line, Circle} from 'react-konva'
import {plus, minus, calculateVector, scale} from './math'
import {TruckVisualization} from './TruckVisualization'
import {TrailerVisualization} from './TrailerVisualization'
import {CouplingDeviceVisualization} from './CouplingDeviceVisualization'
import {BoxVisualization} from './BoxVisualization'
import {WheelVisualization} from './WheelVisualization'
interface TruckTrailerVisualizationProps {
     truck: Truck;
     cordSystemTransformer: CoordinateSystemTransformation
}
export class TruckTrailerVisualization extends React.Component<TruckTrailerVisualizationProps, {}> {

    public constructor(props: TruckTrailerVisualizationProps) {
        super(props)
    }

    public render() {
        
        return <Group>
            <TruckVisualization cordSystemTransformer={this.props.cordSystemTransformer} truck={this.props.truck} wheelOffset={0.2} />
            <TrailerVisualization cordSystemTransformer={this.props.cordSystemTransformer} truck={this.props.truck} wheelOffset={0.2} />
            <CouplingDeviceVisualization cordSystemTransformer={this.props.cordSystemTransformer} truck={this.props.truck} />
        </Group>
    }
}