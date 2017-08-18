import * as React from 'react'
import {Dock} from './model/world'
import {CoordinateSystemTransformation} from './CoordinateSystemTransformation';
import { Layer, Rect, Stage, Group, Line, Circle} from 'react-konva'
import {plus, minus, calculateVector, scale, Point, rotateVector, Angle, StraightLine} from './math'

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

    public extend(a: StraightLine, height: number, width: number): Point[] {
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
        return [start, end]
        }
    }
        
    public render() {
        let p = this.props.dock.position;
        let d = this.props.dock.dockDirection;
        
        let mappedP = this.map(p);
        let [start, end] = this.extend(new StraightLine(p, d),  this.props.canvasHeight, this.props.canvasWidth);


        return <Group>
                    <Circle radius={3} x={mappedP.x} y={mappedP.y} fill="black" />
                    <Line points={[start.x, start.y, end.x, end.y]} stroke="black" />           
        </Group>
    }
}