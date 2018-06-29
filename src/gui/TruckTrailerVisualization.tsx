import * as React from 'react'
import {Truck} from '../model/truck'
import {CoordinateSystemTransformation} from './CoordinateSystemTransformation';
import { Layer, Rect, Stage, Group, Line, Circle} from 'react-konva'
import {plus, minus, calculateVector, scale} from '../math'
import {TruckVisualization} from './TruckVisualization'
import {TrailerVisualization} from './TrailerVisualization'
import {CouplingDeviceVisualization} from './CouplingDeviceVisualization'
import {BoxVisualization} from './BoxVisualization'
import {WheelVisualization} from './WheelVisualization'
import {Point} from '../math';

interface TruckTrailerVisualizationProps {
     truck: Truck;
     cordSystemTransformer: CoordinateSystemTransformation
     onTruckPositionChanged: (translation: Point) => void
     draggable: boolean
}

interface TruckTrailerVisualizationState {
    startX: number
    startY: number
}
export class TruckTrailerVisualization extends React.Component<TruckTrailerVisualizationProps, TruckTrailerVisualizationState> {

    public constructor(props: TruckTrailerVisualizationProps) {
        super(props)
        this.state = {
            startX: undefined,
            startY: undefined
        }
    }


    private updateTruckPosition(e: any) {
        let endX = e.target.children[0].x();
        let endY = e.target.children[0].y();

        let startPoint = new Point(this.state.startX, this.state.startY);
        let endPoint = new Point(endX, endY);
        let groupTranslation = minus(endPoint, startPoint);

        // map back into old cord sys
        let translation = this.props.cordSystemTransformer.mapVectorIntoOldCordSystem(groupTranslation);

        this.props.onTruckPositionChanged(translation);
    }

    private handleDragStart(e: any) {
        console.log("Started dragging!");
        this.setState({
            startX: e.target.children[0].x(),
            startY: e.target.children[0].y()
        })
    }


    public render() {
        
        return <Group onDragStart={this.handleDragStart.bind(this)} onDragEnd={this.updateTruckPosition.bind(this)} draggable={this.props.draggable}>
            <TruckVisualization cordSystemTransformer={this.props.cordSystemTransformer} truck={this.props.truck} wheelOffset={0.2} />
            <TrailerVisualization cordSystemTransformer={this.props.cordSystemTransformer} truck={this.props.truck} wheelOffset={0.2} />
            <CouplingDeviceVisualization cordSystemTransformer={this.props.cordSystemTransformer} truck={this.props.truck} />
        </Group>
    }
}