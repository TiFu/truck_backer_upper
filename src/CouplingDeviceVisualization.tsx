import * as React from 'react'
import {Truck} from './model/truck'
import {CoordinateSystemTransformation} from './CoordinateSystemTransformation';
import { Layer, Rect, Stage, Group, Line, Circle} from 'react-konva'
import {plus, minus, calculateVector, scale, Point, rotateVector, Angle} from './math'
import {BoxVisualization} from './BoxVisualization'
import {WheelVisualization} from './WheelVisualization'

interface CouplingDeviceVisualizationProps {
    truck: Truck;
    cordSystemTransformer: CoordinateSystemTransformation
}
export class CouplingDeviceVisualization extends React.Component<CouplingDeviceVisualizationProps, {}> {

    public constructor(props: CouplingDeviceVisualizationProps) {
        super(props)
    }

    public map(b: Point) { 
        return this.props.cordSystemTransformer.mapIntoNewCordSystem(b);
    }

    public render() {
        let cdp = this.props.truck.getCouplingDevicePosition();
        let cab = this.props.truck.getEndOfTruck();

        // need rotated vector (e.g. 30 degrees)
        let vec = calculateVector(cdp, cab);
        let rotateDegree: Angle = 10 / 180.0 * Math.PI;
        let rotatedDirectionA = scale(rotateVector(vec, rotateDegree), 1 / Math.cos(rotateDegree));
        let rotatedDirectionB = scale(rotateVector(vec, -rotateDegree), 1 / Math.cos(rotateDegree));
        
        let connectPointA = this.map(plus(cdp, rotatedDirectionA))
        let connectPointB = this.map(plus(cdp, rotatedDirectionB));
        cdp = this.map(cdp)
        return <Group>
                     <Line points={[cdp.x, cdp.y, connectPointA.x, connectPointA.y]} stroke="black" />           
                     <Line points={[cdp.x, cdp.y, connectPointB.x, connectPointB.y]} stroke="black" />           
        </Group>
    }
}