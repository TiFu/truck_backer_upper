"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_konva_1 = require("react-konva");
const BoxVisualization_1 = require("./BoxVisualization");
const WheelVisualization_1 = require("./WheelVisualization");
class TruckVisualization extends React.Component {
    constructor(props) {
        super(props);
    }
    map(b) {
        let n = this.props.cordSystemTransformer.mapIntoNewCordSystem(b);
        return n;
    }
    render() {
        let eot = this.props.truck.getEndOfTruck();
        let cfp = this.props.truck.getCabinFrontPosition();
        console.log("Truck Position: " + eot.x + " / " + eot.y);
        console.log("TRuck Front Posd " + cfp.x + " / " + cfp.y);
        let mappedEOT = this.map(eot);
        let mappedCFP = this.map(cfp);
        return React.createElement(react_konva_1.Group, null,
            React.createElement(BoxVisualization_1.BoxVisualization, { points: this.props.truck.getTruckCorners(), cordSystemTransformer: this.props.cordSystemTransformer }),
            React.createElement(WheelVisualization_1.WheelVisualization, { cordSystemTransformer: this.props.cordSystemTransformer, basePoint: eot, pointA: eot, pointB: cfp, wheelLength: 1, wheelOffset: this.props.wheelOffset, boxWidth: this.props.truck.getWidth() }),
            React.createElement(WheelVisualization_1.WheelVisualization, { cordSystemTransformer: this.props.cordSystemTransformer, basePoint: cfp, pointA: cfp, pointB: eot, wheelLength: 1, wheelOffset: this.props.wheelOffset, boxWidth: this.props.truck.getWidth(), steeringAngle: -this.props.truck.getLastSteeringAngle() }),
            React.createElement(react_konva_1.Circle, { radius: 3, x: mappedEOT.x, y: mappedEOT.y, fill: "black" }),
            React.createElement(react_konva_1.Circle, { radius: 3, x: mappedCFP.x, y: mappedCFP.y, fill: "black" }));
    }
}
exports.TruckVisualization = TruckVisualization;
//# sourceMappingURL=TruckVisualization.js.map