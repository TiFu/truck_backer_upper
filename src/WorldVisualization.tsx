import * as React from 'react'
import * as $ from "jquery";
import { Layer, Rect, Stage, Group, Line, Circle} from 'react-konva'
import { World, Dock} from './model/world'
import {Point, plus, scale, minus, calculateVector, Angle, rotate} from './math'
import {Truck} from './model/truck'
export default class WorldVisualization extends React.Component<{ world: World}, {}> {
    canvasWidth: number
    canvasHeight: number

    public constructor(props: { world: World}) {
        super(props);
        this.canvasWidth = 800
        this.canvasHeight = 800
    }

    componentDidMount() {

    }

    componentDidUpdate() {

    }

    public mapPointToCanvas(point: Point) {
        return new Point(10 *point.x + this.canvasWidth * 1/4., this.canvasHeight - (10 * point.y + this.canvasHeight / 2))
    }  

    public mapPointToWorld(point: Point) {
        return new Point(point.x / 10 - this.canvasWidth * 1 /4, this.canvasHeight + point.y / 10 - this.canvasHeight / 2)
    }

    public getDock(dock: Dock) {
        // TODO: use proper calculation to make sure that the drawn line ends at the border!
        let dist_1 = scale(dock.dockDirection, 1 / dock.dockDirection.getLength());
        console.log("Drawing dock");
        let d1 = this.mapPointToCanvas(dock.position.addVector(dock.dockDirection.scale(500)));
        let d2 = this.mapPointToCanvas(dock.position.addVector(dock.dockDirection.scale(-1)));
        dock.dockDirection.scale(1 / 50.)
        let points = []
        for (let i = -100; i < 100; i++) {
            let d = this.mapPointToCanvas(plus(dock.position, scale(dist_1, i)));
            let fill = "black";
            if (i == 0) {
                fill = "red";
            }
            points.push(<Circle key={i} radius={3} x={d.x} y={d.y} fill={fill} />);
        }
        return <Group><Line stroke={"black"} strokeWidth={2} points={[d2.x, d2.y, d1.x, d1.y]} />{points}</Group>
    }

    public getTruck(truck: Truck) {
        console.log("Truck: " + truck.toString());
        let eotPoint = truck.getEndOfTruck();
        let cfp = this.mapPointToCanvas(truck.cabinFrontPosition);
        let eot = this.mapPointToCanvas(eotPoint);
        let cdp = this.mapPointToCanvas(truck.couplingDevicePosition)
        let tep = this.mapPointToCanvas(truck.trailerEndPosition)

        let directionVector = calculateVector(cfp, eot);
        let perpendicular = scale(directionVector.getOrthogonalVector(), 0.5);

        let leftTop = plus(cfp, perpendicular);
        let rightTop = minus(cfp, perpendicular);
        let rightBottom = plus(eot, perpendicular);
        let leftBottom = minus(eot, perpendicular);
        let truckRectanglePoints: number[] = [leftTop.x, leftTop.y, rightTop.x, rightTop.y, leftBottom.x, leftBottom.y, rightBottom.x, rightBottom.y, leftTop.x, leftTop.y];

        let wheelDirection = scale(directionVector, 0.3);
        let wheelOffset = scale(wheelDirection, -0.0);
        let wheelPerpendicular = scale(perpendicular, 0.2);
        let leftWheelBack1 = minus(minus(leftBottom, wheelPerpendicular), wheelOffset);
        let rightWheelBack1 = minus(plus(rightBottom, wheelPerpendicular), wheelOffset);
        let leftWheelBack2 = minus(leftWheelBack1, wheelDirection);
        let rightWheelBack2 = minus(rightWheelBack1, wheelDirection);
        
        let frontLeftWheel1 = plus(minus(leftWheelBack1, directionVector), wheelDirection);
        let frontRightWheel1 = plus(minus(rightWheelBack1, directionVector), wheelDirection);
        let frontLeftWheel2 = plus(minus(leftWheelBack2, directionVector), wheelDirection);
        let frontRightWheel2 = plus(minus(rightWheelBack2, directionVector), wheelDirection);

        console.log("Steering Angle: " + truck.getSteeringAngle() * 180 / Math.PI);
        let steeringAngle: Angle = truck.getSteeringAngle();
        let rotatedWheelDirection = scale(rotate(wheelDirection, steeringAngle), 0.5);
        let wheelDirectionHalf = scale(wheelDirection, 0.5);

        let midLeftPoint = minus(frontLeftWheel1, wheelDirectionHalf);
        frontLeftWheel1 = minus(midLeftPoint, rotatedWheelDirection);
        frontLeftWheel2 = plus(midLeftPoint, rotatedWheelDirection);

        let midRightPoint = minus(frontRightWheel1, wheelDirectionHalf);
        frontRightWheel1 = minus(midRightPoint, rotatedWheelDirection);
        frontRightWheel2 = plus(midRightPoint, rotatedWheelDirection);

        
        let trailerDirection = calculateVector(cdp, tep);
        perpendicular = trailerDirection.getOrthogonalVector(); 
        perpendicular = scale(perpendicular, 0.5 * directionVector.getLength() / perpendicular.getLength());
        leftTop = plus(cdp, perpendicular);
        rightTop = minus(cdp, perpendicular);
        rightBottom = plus(tep, perpendicular);
        leftBottom = minus(tep, perpendicular);
        let trailerRectanglePoints: number[] = [leftTop.x, leftTop.y, rightTop.x, rightTop.y, leftBottom.x, leftBottom.y, rightBottom.x, rightBottom.y, leftTop.x, leftTop.y];

        // TODO: maybe move this to truck and then calculate by transformation => zoom possible!
        let wheelTrailerDirection = scale(trailerDirection, wheelDirection.getLength() / trailerDirection.getLength());
        let wheelTrailerOffset = scale(wheelTrailerDirection, -0.0);
        let wheelTrailerPerpendicular = scale(perpendicular, 0.2);
        let leftWheelTrailerBack1 = minus(minus(leftBottom, wheelTrailerPerpendicular), wheelTrailerOffset);
        let rightWheelTrailerBack1 = minus(plus(rightBottom, wheelTrailerPerpendicular), wheelTrailerOffset);
        let leftWheelTrailerBack2 = minus(leftWheelTrailerBack1, wheelTrailerDirection);
        let rightWheelTrailerBack2 = minus(rightWheelTrailerBack1, wheelTrailerDirection);
                
        return <Group name="truck-trailer">
                <Group name="truck">
                    <Line points={truckRectanglePoints} stroke="black" />
                    <Line points={[leftWheelBack1.x, leftWheelBack1.y, leftWheelBack2.x, leftWheelBack2.y]} stroke="black" />
                    <Line points={[rightWheelBack1.x, rightWheelBack1.y, rightWheelBack2.x, rightWheelBack2.y]} stroke="black" />

                    <Line points={[frontLeftWheel1.x, frontLeftWheel1.y, frontLeftWheel2.x, frontLeftWheel2.y]} stroke="black" />
                    <Line points={[frontRightWheel1.x, frontRightWheel1.y, frontRightWheel2.x, frontRightWheel2.y]} stroke="black" />

                    <Circle radius={5} x={cfp.x} y={cfp.y} fill="black" />
                    <Circle radius={5} x={eot.x} y={eot.y} fill="black" />
                </Group>

                <Group name="couplingDevice">
                    <Line points={[eot.x, eot.y, cdp.x, cdp.y]} stroke="black" />
                </Group>                

                <Group name="trailer">
                    <Line points={trailerRectanglePoints} stroke="black" />
                    <Line points={[leftWheelTrailerBack1.x, leftWheelTrailerBack1.y, leftWheelTrailerBack2.x, leftWheelTrailerBack2.y]} stroke="black" />
                    <Line points={[rightWheelTrailerBack1.x, rightWheelTrailerBack1.y, rightWheelTrailerBack2.x, rightWheelTrailerBack2.y]} stroke="black" />
                    <Circle radius={5} x={cdp.x} y={cdp.y} fill="black" />
                    <Circle radius={5} x={tep.x} y={tep.y} fill="black" />
                </Group>                      
            </Group>
    }
    public render() {
        let dock = this.getDock(this.props.world.dock);
        let truck = this.getTruck(this.props.world.truck)
        return <Stage width={this.canvasHeight} height={this.canvasWidth}>
                <Layer>
                    {dock}
                    {truck}
                </Layer>
            </Stage>
    }
}