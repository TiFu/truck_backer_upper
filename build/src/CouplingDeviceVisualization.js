"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_konva_1 = require("react-konva");
const math_1 = require("./math");
class CouplingDeviceVisualization extends React.Component {
    constructor(props) {
        super(props);
    }
    map(b) {
        return this.props.cordSystemTransformer.mapIntoNewCordSystem(b);
    }
    render() {
        let cdp = this.props.truck.getCouplingDevicePosition();
        let cab = this.props.truck.getEndOfTruck();
        let vec = math_1.calculateVector(cdp, cab);
        let rotateDegree = 10 / 180.0 * Math.PI;
        let rotatedDirectionA = math_1.scale(math_1.rotateVector(vec, rotateDegree), 1 / Math.cos(rotateDegree));
        let rotatedDirectionB = math_1.scale(math_1.rotateVector(vec, -rotateDegree), 1 / Math.cos(rotateDegree));
        let connectPointA = this.map(math_1.plus(cdp, rotatedDirectionA));
        let connectPointB = this.map(math_1.plus(cdp, rotatedDirectionB));
        cdp = this.map(cdp);
        return React.createElement(react_konva_1.Group, null,
            React.createElement(react_konva_1.Line, { points: [cdp.x, cdp.y, connectPointA.x, connectPointA.y], stroke: "black" }),
            React.createElement(react_konva_1.Line, { points: [cdp.x, cdp.y, connectPointB.x, connectPointB.y], stroke: "black" }));
    }
}
exports.CouplingDeviceVisualization = CouplingDeviceVisualization;
//# sourceMappingURL=CouplingDeviceVisualization.js.map