"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_konva_1 = require("react-konva");
const BoxVisualization_1 = require("./BoxVisualization");
const WheelVisualization_1 = require("./WheelVisualization");
class TrailerVisualization extends React.Component {
    constructor(props) {
        super(props);
    }
    map(b) {
        let n = this.props.cordSystemTransformer.mapIntoNewCordSystem(b);
        return n;
    }
    render() {
        let eot = this.props.truck.getTrailerEndPosition();
        let cfp = this.props.truck.getCouplingDevicePosition();
        let mappedEot = this.map(eot);
        let mappedCfp = this.map(cfp);
        return React.createElement(react_konva_1.Group, null,
            React.createElement(BoxVisualization_1.BoxVisualization, { points: this.props.truck.getTrailerCorners(), cordSystemTransformer: this.props.cordSystemTransformer }),
            React.createElement(react_konva_1.Circle, { radius: 3, x: mappedEot.x, y: mappedEot.y, fill: "black" }),
            React.createElement(react_konva_1.Circle, { radius: 3, x: mappedCfp.x, y: mappedCfp.y, fill: "black" }),
            React.createElement(WheelVisualization_1.WheelVisualization, { cordSystemTransformer: this.props.cordSystemTransformer, basePoint: eot, pointA: eot, pointB: cfp, wheelLength: 1, wheelOffset: this.props.wheelOffset, boxWidth: this.props.truck.getWidth() }),
            React.createElement(WheelVisualization_1.WheelVisualization, { cordSystemTransformer: this.props.cordSystemTransformer, basePoint: cfp, pointA: cfp, pointB: eot, wheelLength: 1, wheelOffset: this.props.wheelOffset, boxWidth: this.props.truck.getWidth() }));
    }
}
exports.TrailerVisualization = TrailerVisualization;
//# sourceMappingURL=TrailerVisualization.js.map