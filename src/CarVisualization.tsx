import * as React from 'react'
import {Truck} from './model/truck'
import {Car} from './model/car'
import {CoordinateSystemTransformation} from './CoordinateSystemTransformation';
import { Layer, Rect, Stage, Group, Line, Circle} from 'react-konva'
import {plus, minus, calculateVector, scale, Point} from './math'
import {BoxVisualization} from './BoxVisualization'
import {WheelVisualization} from './WheelVisualization'

interface CarVisualizationProps {
     car: Car;
     wheelOffset: number;
     cordSystemTransformer: CoordinateSystemTransformation
}
export class CarVisualization extends React.Component<CarVisualizationProps, {}> {

    public constructor(props: CarVisualizationProps) {
        super(props)
    }
    
    public map(b: Point) { 
        let n =  this.props.cordSystemTransformer.mapIntoNewCordSystem(b);
        return n;
    }

    public render() {
        let eot = this.props.car.getBack();
        let cfp = this.props.car.getFront();
        console.log("Truck Position: " + eot.x + " / " + eot.y) 
        console.log("TRuck Front Posd " + cfp.x + " / " + cfp.y)
        let mappedEOT = this.map(eot);
        let mappedCFP = this.map(cfp);
        return <Group>
            <BoxVisualization points={this.props.car.getCorners()} cordSystemTransformer={this.props.cordSystemTransformer} />
            <WheelVisualization cordSystemTransformer={this.props.cordSystemTransformer} basePoint={eot} pointA={eot} pointB={cfp} wheelLength={1} wheelOffset={this.props.wheelOffset} boxWidth={this.props.car.getWidth()} />
            <WheelVisualization cordSystemTransformer={this.props.cordSystemTransformer} basePoint={cfp} pointA={cfp} pointB={eot} wheelLength={1} wheelOffset={this.props.wheelOffset} boxWidth={this.props.car.getWidth()} steeringAngle={- this.props.car.getLastSteeringAngle()} />
            <Circle radius={3} x={mappedEOT.x} y={mappedEOT.y} fill="black" />
            <Circle radius={3} x={mappedCFP.x} y={mappedCFP.y} fill="black" />
        </Group>
    }
}