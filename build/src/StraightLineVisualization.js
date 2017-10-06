"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_konva_1 = require("react-konva");
const math_1 = require("./math");
class StraightLineVisualization extends React.Component {
    constructor(props) {
        super(props);
    }
    map(b) {
        return this.props.cordSystemTransformer.mapIntoNewCordSystem(b);
    }
    extendLine(a, height, width) {
        let start = new math_1.Point(0, 0);
        let end = new math_1.Point(0, 0);
        if (a.direction.x == 0) {
            start.x = a.base.x;
            end.x = a.base.x;
            start.y = 0;
            end.y = height;
        }
        else {
            start.x = 0;
            end.x = width;
            let slope = a.direction.y / a.direction.x;
            let b = a.base.y - slope * a.base.x;
            start.y = slope * start.x + b;
            end.y = slope * end.x + b;
        }
        return [start, end];
    }
    render() {
        let mappedLine = new math_1.StraightLine(this.map(this.props.line.base), this.props.line.direction);
        let points = this.extendLine(mappedLine, this.props.canvasHeight, this.props.canvasWidth);
        let start = points[0];
        let end = points[1];
        return React.createElement(react_konva_1.Group, null,
            React.createElement(react_konva_1.Line, { points: [start.x, start.y, end.x, end.y], stroke: "black" }));
    }
}
exports.StraightLineVisualization = StraightLineVisualization;
//# sourceMappingURL=StraightLineVisualization.js.map