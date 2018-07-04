import * as React from 'react'
import { Truck } from '../model/truck'
import { CoordinateSystemTransformation } from './CoordinateSystemTransformation';
import { Layer, Rect, Stage, Group, Line, Circle } from 'react-konva'
import { plus, minus, calculateVector, scale } from '../math'
import { TruckVisualization } from './TruckVisualization'
import { TrailerVisualization } from './TrailerVisualization'
import { CouplingDeviceVisualization } from './CouplingDeviceVisualization'
import { BoxVisualization } from './BoxVisualization'
import { WheelVisualization } from './WheelVisualization'
import { Point } from '../math';

interface TruckTrailerVisualizationProps {
    truck: Truck;
    cordSystemTransformer: CoordinateSystemTransformation
    onTruckPositionChanged: (translation: Point) => void
    draggable: boolean
}

interface TruckTrailerVisualizationState {
    startX: number
    startY: number
    konvaX: number
    konvaY: number
}
export class TruckTrailerVisualization extends React.Component<TruckTrailerVisualizationProps, TruckTrailerVisualizationState> {
    private group: React.RefObject<Group>;

    public constructor(props: TruckTrailerVisualizationProps) {
        super(props)
        this.group = React.createRef();
        this.state = {
            startX: 0,
            startY: 0,
            konvaX: 0,
            konvaY: 0
        }
    }


    private updateTruckPosition(e: any) {
        let absPos = e.target.children[1].getAbsolutePosition();
        let endX = absPos["x"];
        let endY = absPos["y"];

        let startPoint = new Point(this.state.startX, this.state.startY);
        let endPoint = new Point(endX, endY);
        let groupTranslation = minus(endPoint, startPoint);

        // map back into old cord sys
        let translation = this.props.cordSystemTransformer.mapVectorIntoOldCordSystem(groupTranslation);

        this.setState({ konvaX: e.target.x(), konvaY: e.target.y() })
        this.props.onTruckPositionChanged(translation);
    }

    public componentWillReceiveProps() {
        this.setState({ konvaX: 0, konvaY: 0 });
    }

    private handleDragStart(e: any) {
        let absPos = e.target.children[1].getAbsolutePosition();
        this.setState({
            startX: absPos["x"],
            startY: absPos["y"],
            konvaX: e.target.x(),
            konvaY: e.target.y()
        })
    }

    public render() {
        return <Group x={this.state.konvaX} y={this.state.konvaY} ref={this.group} onDragStart={this.handleDragStart.bind(this)} onDragEnd={this.updateTruckPosition.bind(this)} draggable={this.props.draggable}>
            <TruckVisualization cordSystemTransformer={this.props.cordSystemTransformer} truck={this.props.truck} wheelOffset={0.2} />
            <TrailerVisualization cordSystemTransformer={this.props.cordSystemTransformer} truck={this.props.truck} wheelOffset={0.2} />
            <CouplingDeviceVisualization cordSystemTransformer={this.props.cordSystemTransformer} truck={this.props.truck} />
        </Group>
    }
}