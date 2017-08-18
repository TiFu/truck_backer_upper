import * as React from 'react'
import {Truck} from './model/truck'
import {CoordinateSystemTransformation} from './CoordinateSystemTransformation';
import { Layer, Rect, Stage, Group, Line, Circle} from 'react-konva'
import {Point, plus, minus, calculateVector, scale} from './math'


interface BoxVisualizationProps{
    pointA: Point;
    pointB: Point;
    width: number;
    cordSystemTransformer: CoordinateSystemTransformation
}
export class BoxVisualization extends React.Component<BoxVisualizationProps, {}> {

    public constructor(props: BoxVisualizationProps) {
        super(props)
    }

    public map(b: Point) { 
        return this.props.cordSystemTransformer.mapIntoNewCordSystem(b);
    }
    public render() {
        let directionVector = calculateVector(this.props.pointA, this.props.pointB);
        let perpendicular = scale(directionVector.getOrthogonalVector(), this.props.width / directionVector.getLength());

        let leftTop = this.map(plus(this.props.pointA, perpendicular));
        let rightTop = this.map(minus(this.props.pointA, perpendicular));
        let rightBottom = this.map(plus(this.props.pointB, perpendicular));
        let leftBottom = this.map(minus(this.props.pointB, perpendicular));
        let rectanglePoints: number[] = [leftTop.x, leftTop.y, rightTop.x, rightTop.y, leftBottom.x, leftBottom.y, rightBottom.x, rightBottom.y, leftTop.x, leftTop.y];
        
        return  <Group>
                    <Line points={rectanglePoints} stroke="black" />
                    <Circle radius={3} x={this.props.pointA.x} y={this.props.pointA.y} fill="black" />
                    <Circle radius={3} x={this.props.pointB.x} y={this.props.pointB.y} fill="black" />           
                </Group>
    }
}