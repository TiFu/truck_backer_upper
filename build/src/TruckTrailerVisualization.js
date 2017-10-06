"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_konva_1 = require("react-konva");
const TruckVisualization_1 = require("./TruckVisualization");
const TrailerVisualization_1 = require("./TrailerVisualization");
const CouplingDeviceVisualization_1 = require("./CouplingDeviceVisualization");
class TruckTrailerVisualization extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return React.createElement(react_konva_1.Group, null,
            React.createElement(TruckVisualization_1.TruckVisualization, { cordSystemTransformer: this.props.cordSystemTransformer, truck: this.props.truck, wheelOffset: 0.2 }),
            React.createElement(TrailerVisualization_1.TrailerVisualization, { cordSystemTransformer: this.props.cordSystemTransformer, truck: this.props.truck, wheelOffset: 0.2 }),
            React.createElement(CouplingDeviceVisualization_1.CouplingDeviceVisualization, { cordSystemTransformer: this.props.cordSystemTransformer, truck: this.props.truck }));
    }
}
exports.TruckTrailerVisualization = TruckTrailerVisualization;
//# sourceMappingURL=TruckTrailerVisualization.js.map