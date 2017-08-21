import * as React from 'react'
import {Truck} from './model/truck'
import {CoordinateSystemTransformation} from './CoordinateSystemTransformation';
import { Layer, Rect, Stage, Group, Line, Circle} from 'react-konva'
import {Point, plus, minus, calculateVector, scale} from './math'


interface BoxVisualizationProps{
    points: Point[];
    cordSystemTransformer: CoordinateSystemTransformation
}
export class BoxVisualization extends React.Component<BoxVisualizationProps, {}> {

    public constructor(props: BoxVisualizationProps) {
        super(props)
    }

    // TODO: less copies of this function
    public map(b: Point) { 
        let n =  this.props.cordSystemTransformer.mapIntoNewCordSystem(b);
        return n;
    }

    public render() {
        let rectanglePoints: number[] = [];
        let circles = [];
        for (let i = 0; i < this.props.points.length; i++) {
            let point = this.props.points[i];
            let mapped = this.map(point);
            rectanglePoints.push(mapped.x, mapped.y);
        }
        let mapped = this.map(this.props.points[0]);
        rectanglePoints.push(mapped.x, mapped.y);                

        
        return  <Group>
                    <Line points={rectanglePoints} stroke="black" />
                </Group>
    }
}