import * as React from 'react'
import {Dock} from '../model/world'
import {CoordinateSystemTransformation} from './CoordinateSystemTransformation';
import { Layer, Rect, Stage, Group, Line, Circle} from 'react-konva'
import {plus, minus, calculateVector, scale, Point, rotateVector, Angle, StraightLine} from '../math'
import {StraightLineVisualization} from './StraightLineVisualization'

interface DockVisualizationProps {
    dock: Dock;
    cordSystemTransformer: CoordinateSystemTransformation
    canvasWidth: number
    canvasHeight: number
}
export class DockVisualization extends React.Component<DockVisualizationProps, {}> {

    public constructor(props: DockVisualizationProps) {
        super(props)
    }

    public map(b: Point) { 
        return this.props.cordSystemTransformer.mapIntoNewCordSystem(b);
    }

    public extendLine(a: StraightLine, height: number, width: number): Point[] {
        let start = new Point(0,0)
        let end = new Point(0, 0)
        if (a.direction.x == 0) {
            start.x = a.base.x
            end.x = a.base.x
            start.y = 0
            end.y = height
        } else {
            start.x = 0
            end.x = width
            let slope = a.direction.y / a.direction.x
            let b = a.base.y - slope * a.base.x
            start.y = slope * start.x + b
            end.y = slope * end.x + b
        }
        return [start, end]
    }
        
    public render() {
        let p = this.map(this.props.dock.position);
        let d = this.props.dock.dockDirection;
        
        let points = this.extendLine(new StraightLine(p, d),  this.props.canvasHeight, this.props.canvasWidth);
        let start = points[0];
        let end = points[1];
        return <Group>
                    <StraightLineVisualization line={new StraightLine(this.props.dock.position, this.props.dock.dockDirection)} cordSystemTransformer={this.props.cordSystemTransformer} canvasHeight={this.props.canvasHeight} canvasWidth={this.props.canvasWidth} />
                    <Circle radius={3} x={p.x} y={p.y} fill="red" />
        </Group>

//                    <Line points={[start.x, start.y, end.x, end.y]} stroke="black" />           
}
}