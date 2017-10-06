"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_konva_1 = require("react-konva");
const TruckTrailerVisualization_1 = require("./TruckTrailerVisualization");
const StraightLineVisualization_1 = require("./StraightLineVisualization");
const DockVisualization_1 = require("./DockVisualization");
const CoordinateSystemTransformation_1 = require("./CoordinateSystemTransformation");
const math_1 = require("./math");
class WorldVisualization extends React.Component {
    constructor(props) {
        super(props);
        this.canvasWidth = 1600;
        this.canvasHeight = 800;
    }
    componentDidMount() {
    }
    componentDidUpdate() {
    }
    render() {
        let cst = new CoordinateSystemTransformation_1.CoordinateSystemTransformation(15, new math_1.Vector(this.canvasWidth * 1 / 4.0, this.canvasHeight / 2.0));
        let limitVis = [];
        let limits = this.props.world.getLimits();
        for (let i = 0; i < limits.length; i++) {
            let line = limits[i];
            limitVis.push(React.createElement(StraightLineVisualization_1.StraightLineVisualization, { key: i, line: line, cordSystemTransformer: cst, canvasHeight: this.canvasHeight, canvasWidth: this.canvasWidth }));
        }
        return React.createElement(react_konva_1.Stage, { width: this.canvasWidth, height: this.canvasHeight },
            React.createElement(react_konva_1.Layer, null,
                limitVis,
                React.createElement(DockVisualization_1.DockVisualization, { cordSystemTransformer: cst, dock: this.props.world.dock, canvasWidth: this.canvasWidth, canvasHeight: this.canvasHeight }),
                React.createElement(TruckTrailerVisualization_1.TruckTrailerVisualization, { cordSystemTransformer: cst, truck: this.props.world.truck })));
    }
}
exports.default = WorldVisualization;
//# sourceMappingURL=WorldVisualization.js.map