"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const WorldVisualization_1 = require("./WorldVisualization");
const world_1 = require("./model/world");
const train_1 = require("./neuralnet/train");
const implementations_1 = require("./neuralnet/implementations");
const math_1 = require("./math");
const HighCharts = require("react-highcharts");
class Simulation extends React.Component {
    constructor(props) {
        super(props);
        this.emulatorTrainSteps = 0;
        this.emulatorTrainStepsTarget = 0;
        this.emulatorTrainStepsPerFrame = 1;
        this.emulatedSteps = 5;
        this.worldIsSet = false;
        this.controllerTrainStepsTarget = 0;
        this.controllerTrainSteps = 0;
        this.controllerAniFrameCallback = this.controllerAnimationStep.bind(this);
        this.emulatorAniFrameCallback = this.emulatorAnimationStep.bind(this);
        if (Simulation.instance)
            throw Error("Already instantiated");
        else
            Simulation.instance = this;
        this.state = { world: new world_1.World(), steeringSignal: 0, running: false, emulatorWeights: undefined };
        this.trainTruckEmulator = new train_1.TrainTruckEmulator(this.state.world, implementations_1.emulatorNet);
        this.trainTruckController = new train_1.TrainTruckController(this.state.world, implementations_1.controllerNet, implementations_1.emulatorNet);
        train_1.TrainTruckController;
    }
    steeringSignalChanged(evt) {
        this.setState({ steeringSignal: parseFloat(evt.target.value) });
    }
    nextStep() {
        let predicted = this.trainTruckEmulator.getEmulatorNet().forward(this.state.world.truck.getStateVector().getWithNewElement(this.state.steeringSignal));
        console.log("[Old Pos is] " + this.state.world.truck.getStateVector());
        console.log(this.state.world.nextTimeStep(this.state.steeringSignal));
        console.log("[New Pos predicted] " + predicted);
        console.log("[New Pos is] " + this.state.world.truck.getStateVector().toString());
        this.forceUpdate();
    }
    nextControllerTrainStep() {
        this.controllerTrainStepsTarget += 1;
        this.setState({ running: true });
        this.lastTimestamp = this.lastTimestamp = performance.now();
        window.requestAnimationFrame(this.controllerAniFrameCallback);
    }
    randomizePosition() {
        let tep = new math_1.Point(12, 12);
        let tep2 = new math_1.Point(58, -13);
        this.state.world.truck.setTruckIntoRandomPosition([tep, tep2], [-Math.PI, Math.PI]);
        this.onFrame(true);
    }
    prepTrainTruckPositon() {
        this.trainTruckController.prepareTruckPosition();
        this.onFrame(true);
    }
    controllerAnimationStep(timestamp) {
        let delta = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        if (delta > 1000 / 5) {
            console.log(delta);
            console.warn(`only ${(1000 / delta).toFixed(1)} fps`);
            delta = 1000 / 5;
        }
        this.controllerTrainSteps++;
        console.log(this.controllerTrainSteps + " of " + this.controllerTrainStepsTarget);
        this.trainTruckController.prepareTruckPosition();
        this.trainTruckController.trainStep();
        console.log("End of train truck controller");
        if (this.controllerTrainSteps < this.controllerTrainStepsTarget && this.state.running) {
            this.onFrame(true);
            window.requestAnimationFrame(this.controllerAniFrameCallback);
        }
        else {
            this.setState({ running: false });
        }
    }
    nextEmulatorTrainStep() {
        this.emulatorTrainStepsTarget += 1000;
        this.setState({ running: true });
        this.lastTimestamp = this.lastTimestamp = performance.now();
        window.requestAnimationFrame(this.emulatorAniFrameCallback);
    }
    emulatorAnimationStep(timestamp) {
        let delta = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        if (delta > 1000 / 5) {
            console.log(delta);
            console.warn(`only ${(1000 / delta).toFixed(1)} fps`);
            delta = 1000 / 5;
        }
        for (let i = 0; i < this.emulatorTrainStepsPerFrame && this.emulatorTrainSteps < this.emulatorTrainStepsTarget && this.state.running; i++) {
            this.emulatorTrainSteps++;
            console.log(this.emulatorTrainSteps + " of " + this.emulatorTrainStepsTarget);
            let epochs = 0;
            while (epochs < this.emulatedSteps && this.state.running) {
                epochs += this.trainTruckEmulator.train(this.emulatedSteps);
                this.state.world.randomize();
                this.onFrame(true);
            }
        }
        if (this.emulatorTrainSteps < this.emulatorTrainStepsTarget && this.state.running) {
            this.onFrame(false);
            window.requestAnimationFrame(this.emulatorAniFrameCallback);
        }
        else {
            this.setState({ running: false });
        }
    }
    onFrame(forceRedraw) {
        if (forceRedraw)
            this.forceUpdate();
    }
    getEmulatorErrorConfig() {
        return {
            "chart": {
                "type": "line"
            },
            xAxis: {},
            yAxis: {},
            series: [
                {
                    name: "Emulator Error",
                    data: this.trainTruckEmulator.getErrorCurve()
                }
            ]
        };
    }
    getControllerErrorConfig() {
        return {
            "chart": {
                "type": "line"
            },
            xAxis: {},
            yAxis: {},
            series: [
                {
                    name: "Controller Error",
                    data: this.trainTruckController.getErrorCurve()
                }
            ]
        };
    }
    saveEmulatorWeights() {
        console.log("saving emulator weights");
        console.log("Weights: ", this.trainTruckEmulator.getEmulatorNet().getWeights());
        this.setState({ emulatorWeights: this.trainTruckEmulator.getEmulatorNet().getWeights() });
    }
    loadEmulatorWeights() {
        let val = this.emulatorNetTextArea.value;
        try {
            let newWeights = JSON.parse(val);
            this.trainTruckEmulator.getEmulatorNet().loadWeights(newWeights);
        }
        catch (e) {
            alert("Invalid Emulator Weights");
        }
    }
    stopTraining() {
        this.setState({ running: false });
    }
    render() {
        console.log("Text Area Content: ", JSON.stringify(this.state.emulatorWeights));
        return React.createElement("div", null,
            React.createElement(WorldVisualization_1.default, { world: this.state.world }),
            "SteeringSignal:",
            React.createElement("input", { type: "text", onChange: this.steeringSignalChanged.bind(this) }),
            React.createElement("input", { type: "button", onClick: this.nextStep.bind(this), value: "Next Time Step" }),
            React.createElement("input", { type: "button", disabled: this.state.running, onClick: this.nextEmulatorTrainStep.bind(this), value: "Train Emulator" }),
            React.createElement("input", { type: "button", disabled: this.state.running, onClick: this.saveEmulatorWeights.bind(this), value: "Save Emulator Weights" }),
            React.createElement("input", { type: "button", disabled: this.state.running, onClick: this.loadEmulatorWeights.bind(this), value: "Load Emulator Weights" }),
            React.createElement("input", { type: "button", disabled: this.state.running, onClick: this.nextControllerTrainStep.bind(this), value: "Train Controller" }),
            React.createElement("input", { type: "button", disabled: this.state.running, onClick: this.prepTrainTruckPositon.bind(this), value: "Prep Position" }),
            React.createElement("input", { type: "button", onClick: this.stopTraining.bind(this), value: "Stop" }),
            React.createElement("input", { type: "button", onClick: this.randomizePosition.bind(this), value: "Randomize Pos" }),
            React.createElement(HighCharts, { config: this.getEmulatorErrorConfig() }),
            React.createElement(HighCharts, { config: this.getControllerErrorConfig() }),
            "Emulator Weights:",
            React.createElement("textarea", { ref: (input) => this.emulatorNetTextArea = input, value: JSON.stringify(this.state.emulatorWeights) }));
    }
}
exports.default = Simulation;
//# sourceMappingURL=Simulation.js.map