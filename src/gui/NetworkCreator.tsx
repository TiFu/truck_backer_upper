import * as React from 'react'
import {NetConfig, LayerConfig} from '../neuralnet/net';
import { ErrorFunction } from '../neuralnet/error';
import { Optimizer, SGD, SGDNesterovMomentum } from '../neuralnet/optimizers';
import { WeightInitializer, RandomWeightInitializer, TwoLayerInitializer } from '../neuralnet/weightinitializer';
import { ActivationFunction, Tanh } from '../neuralnet/activation';
import {AdalineUnit} from '../neuralnet/unit';

export interface NetworkCreatorProps {
    errorFunctions?: { [key: string]: ErrorFunction};
    optimizers: {[key: string]: () => Optimizer};
    weightInitializers: {[key: string]: WeightInitializer};
    activations: { [key: string]: ActivationFunction}
    network: NetConfig;
    showInfo: boolean;
    onChange: (config: NetConfig, keepWeights: boolean) => void;
    showOptimizer: boolean;
}

export class NetworkCreator extends React.Component<NetworkCreatorProps, {}> {

    public constructor(props: NetworkCreatorProps) {
        super(props);
    }


    private onLayerChange(index: number, layer: LayerConfig) {
        let network = this.props.network;
        if (layer !== null) {
            network.layerConfigs[index] = layer;
        } else {
            network.layerConfigs.splice(index, 1);
        }
        this.props.onChange(network, false);
    }

    private handleInputsChanged(e: React.ChangeEvent<HTMLInputElement>) {
        let network = this.props.network;
        try {
            network.inputs = Number.parseInt(e.currentTarget.value);
            this.props.onChange(network, false);
        } catch (e) {
            console.log(e);
        }
    }

    private handleOptimizerChanged(e: React.ChangeEvent<HTMLSelectElement>) {
        let network = this.props.network;
        network.optimizer = this.props.optimizers[e.currentTarget.value];
        this.props.onChange(network, true);
    }
    private handleErrorFunctionChanged(e: React.ChangeEvent<HTMLSelectElement>) {
        let network = this.props.network;
        network.errorFunction = this.props.errorFunctions[e.currentTarget.value];
        this.props.onChange(network, true);
    }

    private handleAddLayer() {
        let network = this.props.network;
        network.layerConfigs.push(null);
        network.layerConfigs[network.layerConfigs.length - 1] = network.layerConfigs[network.layerConfigs.length - 2];
        network.layerConfigs[network.layerConfigs.length - 2] = {
            neuronCount: 5,
            weightInitializer: new RandomWeightInitializer(0.5),
            unitConstructor:(weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
            activation: new Tanh()
        }
        console.log("added layer!");
        console.log(network.layerConfigs);
        this.props.onChange(network, false);
    }

    private handleOptimizerPropertyChanged(index: number, property: any) {
        let sampleOptimizer = this.props.network.optimizer();
        let network = this.props.network;
        if (sampleOptimizer instanceof SGD) {
            if (index === 0) {
                let lr = Number.parseFloat(property.currentTarget.value);
                network.optimizer = () => new SGD(lr);
            }
        } else if (sampleOptimizer instanceof SGDNesterovMomentum){
            let optimizer = sampleOptimizer as SGDNesterovMomentum;
            if (index === 0) {
                let lr = Number.parseFloat(property.currentTarget.value)
                network.optimizer = () => new SGDNesterovMomentum(lr, optimizer.momentum);
            } else if (index === 1) {
                let momentum = Number.parseFloat(property.currentTarget.value)
                network.optimizer = () => new SGDNesterovMomentum(optimizer.learningRate, momentum);
            }
        }
        this.props.onChange(network, true);
    }

    private getOptimizerEditProperty(optimizer: Optimizer) {
        if (optimizer instanceof SGD) {
            return <div className="container pb">
                <div className="row pb">
                    <div className="col-sm-3 pt">
                        <label htmlFor="learningRate" className="pl pr">Learning Rate:</label>
                    </div>
                <div className="col-sm-3">
                    <input defaultValue={optimizer.learningRate.toString()} id="learningRate" type="text" onBlur={(e) => this.handleOptimizerPropertyChanged(0, e)} className="form-control"/>
                </div>
            </div>
        </div>
        } else if (optimizer instanceof SGDNesterovMomentum) {
            return <div className="container pb">
                <div className="row pb">
                    <div className="col-sm-3 pt">
                        <label htmlFor="learningRate" className="pl pr">Learning Rate:</label>
                </div>
                <div className="col-sm-3">
                        <input defaultValue={optimizer.learningRate.toString()} id="learningRate" type="text" onBlur={(e) => this.handleOptimizerPropertyChanged(0, e)} className="form-control"/>                    </div>
                </div>
                <div className="row pb">
                    <div className="col-sm-3 pt">
                        <label htmlFor="momentum" className="pl pr">Momentum:</label>
                    </div>
                    <div className="col-sm-3">
                        <input defaultValue={optimizer.momentum.toString()} id="momentum" type="text" onBlur={(e) => this.handleOptimizerPropertyChanged(1, e)} className="form-control"/>
                    </div>
                </div>
        </div>
        } else {
            return <div></div>
        }
    }

    public render() {
        let optimizers = [];
        let selectedOptimizer = this.props.network.optimizer().getName();
        for (let optimizer in this.props.optimizers) {
            optimizers.push(<option key={optimizer} value={optimizer}>{optimizer}</option>);
        }

        let errorFunctionComponent = undefined;
        if (this.props.errorFunctions !== undefined) {
            let errorFunctions = [];
            let selectedErrorFunction = this.props.network.errorFunction.getName();
            for (let errorFunction in this.props.errorFunctions) {
                errorFunctions.push(<option key={errorFunction} value={errorFunction}>{errorFunction}</option>);            
            }
            errorFunctionComponent = <div className="row pb">
                <div className="col-sm-3">
                    <label>Error Function:</label>
                </div>
                <div className="col-sm-3 align-right">
                    <select defaultValue={selectedErrorFunction} className="select form-control" 
                            onChange={this.handleErrorFunctionChanged.bind(this)}>
                        {errorFunctions}
                    </select>
                </div>
            </div>;
        }

        let optimizerComponent = <div className="row pb">
            <div className="col-sm-3">
                <label>Optimizer:</label>
            </div>
            <div className="col-sm-3 align-right">
                <select defaultValue={selectedOptimizer} className="select form-control" 
                        onChange={this.handleOptimizerChanged.bind(this)}>
                    {optimizers}
                </select>
            </div>
            <div className="col-sm-6">
                {this.getOptimizerEditProperty(this.props.network.optimizer())}
            </div>
        </div>

        if (!this.props.showOptimizer) {
            optimizerComponent = undefined;
        }   
             
        let netComponent = <div className="container">
            <div className="row pb">
                <div className="col-sm-3">
                    <label>Inputs:</label>
                </div>
                <div className="col-sm-3 align-right">
                    <input type="text" 
                            value={this.props.network.inputs}
                            onBlur={this.handleInputsChanged.bind(this)} 
                            className="form-control" disabled/>
                </div>
            </div>
            {errorFunctionComponent}
            {optimizerComponent}
        </div>;

        let layers = this.props.network.layerConfigs.map((l: LayerConfig, index: number) => {
            console.log("Rendering layer with ", l.neuronCount, "neurons!")
            return <LayerCreator id={index} key={Math.random() * 100} layer={l} 
                                weightInitializers={this.props.weightInitializers} 
                                activations={this.props.activations}
                                onChange={(layer) => this.onLayerChange(index, layer)}
                                disableNeuronEdit={index+1 === this.props.network.layerConfigs.length} />
        });

        let info = undefined;
        if (this.props.showInfo) {
            info =  <div className="alert alert-info" role="alert">
                        Changes to the <strong>Error Function</strong> and <strong>Optimizer</strong> do <strong>not</strong> reset the network state i.e. weights are preserved.
                    </div>;
        }
        return <div className="container">
                <h2>Network Configuration</h2>
                {info}
                {netComponent}
                <h3>Layers</h3>
                <button type="button"  onClick={this.handleAddLayer.bind(this)} className="mb btn btn-success">Add layer</button>
                <table className="table table-hover">
                        <thead>
                            <tr>
                                <th>Layer</th>
                                <th>Neurons</th>
                                <th>Activation</th>
                                <th>Weight Initializer</th>
                                <th>Weight Initializer Parameters</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {layers}
                        </tbody>
                </table>
            </div>
    }
}

interface LayerCreatorProps {
    id: number
    layer: LayerConfig
    weightInitializers: {[key: string]: WeightInitializer};
    activations: { [key: string]: ActivationFunction}
    onChange: (layer: LayerConfig) => void;
    disableNeuronEdit: boolean;
}

class LayerCreator extends React.Component<LayerCreatorProps, {}> {

    public constructor(props: LayerCreatorProps) {
        super(props)
    }

    private handleActivationChanged(e: React.ChangeEvent<HTMLSelectElement>) {
        let activation = e.currentTarget.value;
        if (!this.props.activations[activation]) {
            return;
        }
        let layer = this.props.layer;
        layer.activation = this.props.activations[activation];
        this.props.onChange(layer);
    }

    private handleWeightInitializerChanged(e: React.ChangeEvent<HTMLSelectElement>) {
        let initializer= e.currentTarget.value;
        if (!this.props.weightInitializers[initializer]) {
            return;
        }

        let layer = this.props.layer;
        layer.weightInitializer = this.props.weightInitializers[initializer];
        this.props.onChange(layer);
    }

    private handleNeuronCountChanged(e: React.ChangeEvent<HTMLInputElement>){ 
        let neuronCount = e.currentTarget.value;
        try {
            let layer = this.props.layer;
            layer.neuronCount = Number.parseInt(neuronCount);
            this.props.onChange(layer);
        } catch (e) {
            console.log(e);
        }
    }

    private handleRemoveLayer() {
        this.props.onChange(null);
    }

    private handleWeightInitializerPropsChanged(e: any) {
        if (this.props.layer.weightInitializer instanceof TwoLayerInitializer) {
            let overlap = Number.parseFloat(e.currentTarget.value);
            this.props.layer.weightInitializer = new TwoLayerInitializer(overlap, this.props.layer.neuronCount);
            this.props.onChange(this.props.layer);
        } else if (this.props.layer.weightInitializer instanceof RandomWeightInitializer) {
            let range = Number.parseFloat(e.currentTarget.value);
            this.props.layer.weightInitializer = new RandomWeightInitializer(range)
            this.props.onChange(this.props.layer);
        }
    }
    public getWeightInitializerProps(weightInitializer: WeightInitializer) {
        if (weightInitializer instanceof TwoLayerInitializer) {
            return <div className="row">
                        <div className="col-4">
                            <label htmlFor="overlap" className="pl pr">Overlap:</label>        
                        </div>
                        <div className="col-8">
                            <input defaultValue={weightInitializer.overlap.toString()} id="overlap" type="text" onBlur={this.handleWeightInitializerPropsChanged.bind(this)} className="form-control"/>
                        </div>
                    </div>
        } else if (weightInitializer instanceof RandomWeightInitializer) {
            return <div className="row">
                    <div className="col-4">
                        <label htmlFor="range" className="pl pr">Range:</label>        
                    </div>
                    <div className="col-8">
                        <input defaultValue={weightInitializer.weightRange.toString()} id="range" type="text" onBlur={this.handleWeightInitializerPropsChanged.bind(this)} className="form-control"/>
                    </div>
                </div>
        }
    }
    public render() {
        let activations: any[] = [];
        let selectedActivation = this.props.layer.activation.getName();
        for (let activation in this.props.activations) {
            activations.push(<option key={activation}  value={activation}>{activation}</option>);
        }

        let initializers: any[] = [];
        let selectedInitializer = this.props.layer.weightInitializer.getName();
        for (let initializer in this.props.weightInitializers) {
            initializers.push(<option key={initializer} value={initializer}>{initializer}</option>);
        }
        let button = undefined;
        if (!this.props.disableNeuronEdit) {
            button = <button type="button"  onClick={this.handleRemoveLayer.bind(this)} className="btn btn-danger"><span className="fas fa-trash-alt"></span></button>;
        }
        return <tr>
                <td>{this.props.id}</td>
                <td><input defaultValue={this.props.layer.neuronCount.toString()} id="email" type="text" onBlur={this.handleNeuronCountChanged.bind(this)} disabled={this.props.disableNeuronEdit} className="form-control"/></td>
                <td><select defaultValue={selectedActivation} id="activation" onChange={this.handleActivationChanged.bind(this)} className="select form-control">{activations}</select></td>
                <td><select defaultValue={selectedInitializer} id="weight" onChange={this.handleWeightInitializerChanged.bind(this)} className="select form-control">{initializers}</select></td>
                <td>{this.getWeightInitializerProps(this.props.layer.weightInitializer)}</td>
                <td>{button}</td>
            </tr>
    }
}