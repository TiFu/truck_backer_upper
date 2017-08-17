import * as React from 'react'
import WorldVisualization from "./WorldVisualization"
import {World} from './model/world'


interface SimulationState {
     world: World;
     steeringSignal: number;
}
export default class Simulation extends React.Component<{}, SimulationState> {
    static instance: Simulation;

    public constructor(props: {}) {
        super(props)
        if (Simulation.instance) throw Error("Already instantiated")
        else Simulation.instance = this;
        this.state = {world: new World(), steeringSignal: 0};
    }

    public steeringSignalChanged(evt: any) {
        this.setState({steeringSignal: parseFloat(evt.target.value)});
    }

    public nextStep() {
        this.state.world.nextTimeStep(this.state.steeringSignal);
        this.forceUpdate();
    }

    public render() {
        return <div>
            <WorldVisualization world={this.state.world} />
            SteeringSignal: 
            <input type="text"  onChange={this.steeringSignalChanged.bind(this)}/>
            <input type="button" onClick={this.nextStep.bind(this)} value="Next Time Step" />
        </div>
    }
}