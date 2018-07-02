import * as React from 'react'
import {CoordinateSystemTransformation} from './CoordinateSystemTransformation';
import { Group, Line} from 'react-konva'
import {Point} from '../math'


interface BoxVisualizationProps{
    points: Point[];
    cordSystemTransformer: CoordinateSystemTransformation;
    color?: string;
}
export class BoxVisualization extends React.Component<BoxVisualizationProps, {}> {
    static defaultProps = { color: "black"};
    
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
        for (let i = 0; i < this.props.points.length; i++) {
            let point = this.props.points[i];
            let mapped = this.map(point);
            rectanglePoints.push(mapped.x, mapped.y);
        }
        let mapped = this.map(this.props.points[0]);
        rectanglePoints.push(mapped.x, mapped.y);                

        
        return  <Group>
                    <Line closed={true} points={rectanglePoints} stroke={this.props.color} />
                </Group>
    }
}