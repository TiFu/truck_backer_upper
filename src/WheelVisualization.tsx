import * as React from 'react'
import {Truck} from './model/truck'
import {CoordinateSystemTransformation} from './CoordinateSystemTransformation';
import { Layer, Rect, Stage, Group, Line, Circle} from 'react-konva'
import {Point, plus, minus, calculateVector, scale, Angle, rotateVector, Vector} from './math'


interface WheelVisualizationProps{
    pointA: Point;
    pointB: Point;
    basePoint: Point;
    boxWidth: number
    wheelOffset: number;
    wheelLength: number;
    cordSystemTransformer: CoordinateSystemTransformation
    steeringAngle?: Angle;
}
export class WheelVisualization extends React.Component<WheelVisualizationProps, {}> {
    public static defaultProps: Partial<WheelVisualizationProps> = {
        steeringAngle: 0
    }

    public constructor(props: WheelVisualizationProps) {
        super(props)
    }

    public map(b: Point) { 
        return this.props.cordSystemTransformer.mapIntoNewCordSystem(b);
    }

    public getRotatedPoints(begin: Point, end: Point, direction: Vector) {
        let midPoint = plus(begin, scale(calculateVector(begin, end), 0.5));
        let newBegin = minus(midPoint, direction);
        let newEnd = plus(midPoint, direction);
        return [newBegin, newEnd];
    }

    public render() {
        let directionVector = calculateVector(this.props.pointA, this.props.pointB);

        let ortho = directionVector.getOrthogonalVector();
        let perpendicular = scale(ortho, (0.5 * this.props.boxWidth * (1 + this.props.wheelOffset)) / ortho.getLength());

        let wheelDirection = scale(directionVector, this.props.wheelLength / directionVector.getLength());

        let rotatedWheelDirection = scale(rotateVector(wheelDirection, this.props.steeringAngle), 0.5);

        let wheelBeginLeft = plus(this.props.basePoint, perpendicular);
        let wheelBeginRight = minus(this.props.basePoint, perpendicular); 
        let wheelEndLeft = plus(wheelBeginLeft, wheelDirection);
        let wheelEndRight = plus(wheelBeginRight, wheelDirection);

        // Calculate midpoint
        [wheelBeginLeft, wheelEndLeft] = this.getRotatedPoints(wheelBeginLeft, wheelEndLeft, rotatedWheelDirection);
        [wheelBeginRight, wheelEndRight] = this.getRotatedPoints(wheelBeginRight, wheelEndRight, rotatedWheelDirection);
        
        // map into canvas
        wheelBeginLeft = this.map(wheelBeginLeft)
        wheelEndLeft = this.map(wheelEndLeft);
        wheelBeginRight = this.map(wheelBeginRight);
        wheelEndRight = this.map(wheelEndRight)
        return  <Group>
                    <Line points={[wheelBeginLeft.x, wheelBeginLeft.y, wheelEndLeft.x, wheelEndLeft.y]} stroke="black" />
                    <Line points={[wheelBeginRight.x, wheelBeginRight.y, wheelEndRight.x, wheelEndRight.y]} stroke="black" />
                </Group>
    }
}