"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_konva_1 = require("react-konva");
class BoxVisualization extends React.Component {
    constructor(props) {
        super(props);
    }
    map(b) {
        let n = this.props.cordSystemTransformer.mapIntoNewCordSystem(b);
        return n;
    }
    render() {
        let rectanglePoints = [];
        let circles = [];
        for (let i = 0; i < this.props.points.length; i++) {
            let point = this.props.points[i];
            let mapped = this.map(point);
            rectanglePoints.push(mapped.x, mapped.y);
        }
        let mapped = this.map(this.props.points[0]);
        rectanglePoints.push(mapped.x, mapped.y);
        return React.createElement(react_konva_1.Group, null,
            React.createElement(react_konva_1.Line, { points: rectanglePoints, stroke: "black" }));
    }
}
exports.BoxVisualization = BoxVisualization;
//# sourceMappingURL=BoxVisualization.js.map