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
        console.log("Old: ", b.toString());
        let n =  this.props.cordSystemTransformer.mapIntoNewCordSystem(b);
        console.log("New: ", n.toString());
        return n;
    }

    public render() {
        console.log("Box Width: ", this.props.width);
        let directionVector = calculateVector(this.props.pointA, this.props.pointB);
        let ortho = directionVector.getOrthogonalVector();
        let perpendicular = scale(ortho, 0.5 * this.props.width / ortho.getLength());

        let leftTop = this.map(plus(this.props.pointA, perpendicular));
        let rightTop = this.map(minus(this.props.pointA, perpendicular));
        let rightBottom = this.map(plus(this.props.pointB, perpendicular));
        let leftBottom = this.map(minus(this.props.pointB, perpendicular));
        let rectanglePoints: number[] = [leftTop.x, leftTop.y, rightTop.x, rightTop.y, leftBottom.x, leftBottom.y, rightBottom.x, rightBottom.y, leftTop.x, leftTop.y];
        
        let mappedA = this.map(this.props.pointA);
        let mappedB = this.map(this.props.pointB);
        return  <Group>
                    <Line points={rectanglePoints} stroke="black" />
                    <Circle radius={3} x={mappedA.x} y={mappedA.y} fill="black" />
                    <Circle radius={3} x={mappedB.x} y={mappedB.y} fill="black" />           
                </Group>
    }
}