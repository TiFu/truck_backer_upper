"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_konva_1 = require("react-konva");
const math_1 = require("./math");
const StraightLineVisualization_1 = require("./StraightLineVisualization");
class DockVisualization extends React.Component {
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
        let p = this.map(this.props.dock.position);
        let d = this.props.dock.dockDirection;
        let points = this.extendLine(new math_1.StraightLine(p, d), this.props.canvasHeight, this.props.canvasWidth);
        let start = points[0];
        let end = points[1];
        return React.createElement(react_konva_1.Group, null,
            React.createElement(StraightLineVisualization_1.StraightLineVisualization, { line: new math_1.StraightLine(this.props.dock.position, this.props.dock.dockDirection), cordSystemTransformer: this.props.cordSystemTransformer, canvasHeight: this.props.canvasHeight, canvasWidth: this.props.canvasWidth }),
            React.createElement(react_konva_1.Circle, { radius: 3, x: p.x, y: p.y, fill: "red" }));
    }
}
exports.DockVisualization = DockVisualization;
//# sourceMappingURL=DockVisualization.js.map