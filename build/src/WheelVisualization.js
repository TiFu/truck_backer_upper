"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_konva_1 = require("react-konva");
const math_1 = require("./math");
class WheelVisualization extends React.Component {
    constructor(props) {
        super(props);
    }
    map(b) {
        return this.props.cordSystemTransformer.mapIntoNewCordSystem(b);
    }
    getRotatedPoints(begin, end, direction) {
        let midPoint = math_1.plus(begin, math_1.scale(math_1.calculateVector(begin, end), 0.5));
        let newBegin = math_1.minus(midPoint, direction);
        let newEnd = math_1.plus(midPoint, direction);
        return [newBegin, newEnd];
    }
    render() {
        let directionVector = math_1.calculateVector(this.props.pointA, this.props.pointB);
        let ortho = directionVector.getOrthogonalVector();
        let perpendicular = math_1.scale(ortho, (0.5 * this.props.boxWidth * (1 + this.props.wheelOffset)) / ortho.getLength());
        let wheelDirection = math_1.scale(directionVector, this.props.wheelLength / directionVector.getLength());
        let rotatedWheelDirection = math_1.scale(math_1.rotateVector(wheelDirection, this.props.steeringAngle), 0.5);
        let wheelBeginLeft = math_1.plus(this.props.basePoint, perpendicular);
        let wheelBeginRight = math_1.minus(this.props.basePoint, perpendicular);
        let wheelEndLeft = math_1.plus(wheelBeginLeft, wheelDirection);
        let wheelEndRight = math_1.plus(wheelBeginRight, wheelDirection);
        [wheelBeginLeft, wheelEndLeft] = this.getRotatedPoints(wheelBeginLeft, wheelEndLeft, rotatedWheelDirection);
        [wheelBeginRight, wheelEndRight] = this.getRotatedPoints(wheelBeginRight, wheelEndRight, rotatedWheelDirection);
        wheelBeginLeft = this.map(wheelBeginLeft);
        wheelEndLeft = this.map(wheelEndLeft);
        wheelBeginRight = this.map(wheelBeginRight);
        wheelEndRight = this.map(wheelEndRight);
        return React.createElement(react_konva_1.Group, null,
            React.createElement(react_konva_1.Line, { points: [wheelBeginLeft.x, wheelBeginLeft.y, wheelEndLeft.x, wheelEndLeft.y], stroke: "black" }),
            React.createElement(react_konva_1.Line, { points: [wheelBeginRight.x, wheelBeginRight.y, wheelEndRight.x, wheelEndRight.y], stroke: "black" }));
    }
}
WheelVisualization.defaultProps = {
    steeringAngle: 0
};
exports.WheelVisualization = WheelVisualization;
//# sourceMappingURL=WheelVisualization.js.map