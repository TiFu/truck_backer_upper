import * as React from 'react'
import {Simulation} from './Simulation'
import { Car } from "../model/car";
import { Point } from "../math";
import { Dock } from "../model/world";
import { Truck} from '../model/truck';
import { NetworkCreator } from './NetworkCreator';

import {NetConfig} from '../neuralnet/net';
import { MSE, ErrorFunction } from '../neuralnet/error';
import { SGD, Optimizer, SGDNesterovMomentum } from '../neuralnet/optimizers';
import {RandomWeightInitializer, TwoLayerInitializer, WeightInitializer} from '../neuralnet/weightinitializer';
import {Tanh, Sigmoid, ActivationFunction, ReLu, Linear} from '../neuralnet/activation';
import {AdalineUnit} from '../neuralnet/unit';
import { LoadingModal } from './LoadingModal';
import {NeuralNet} from '../neuralnet/net';

interface EmulatorProps {
    object: Car | Truck;
}

interface EmulatorState {
    network: NetConfig;
    nn: NeuralNet;
    loadingWeights: boolean;
    loadWeightsSuccessful: boolean | null;
    loadWeightsFailureMsg: string | null
}

export class Emulator extends React.Component<EmulatorProps, EmulatorState> {

    public constructor(props: EmulatorProps) {
        super(props);
        this.state = { 
            network: this.getDefaultNetConfig(),
            nn: undefined,
            loadingWeights: false,
            loadWeightsSuccessful: null,
            loadWeightsFailureMsg: null

        };
    }

    public handleTrain() {

    }

    public handleLoadPretrainedWeights() {
        $.ajax({
            url: "weights/car_emulator_weights",
            dataType: "text",
            mimeType: "application/json",
            success: (data) => {
                let network = this.state.network;
                let neuralNet = new NeuralNet(network);

                try {
                    neuralNet.loadWeights(JSON.parse(data));
                    console.log("Loaded nn weights");
                    this.setState({
                        loadingWeights: false, 
                        nn: neuralNet, 
                        loadWeightsSuccessful: true });
                } catch (e) {
                    this.setState({
                        network: network,
                        loadingWeights: false,
                        nn: null,
                        loadWeightsSuccessful: false,
                        loadWeightsFailureMsg: "" + e
                    })
                }
            }
        })    
    }

    private getDefaultNetConfig() {
        return this.props.object instanceof Car ? this.getCarNet() : this.getTruckNet();
    }

    private getCarNet() {
        const carHiddenEmulatorLayer = {
            neuronCount: 45,
            weightInitializer: new TwoLayerInitializer(0.7, 45),
            unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
            activation: new Tanh()
        }
        
        const carOutputEmulatorLayer = {
            neuronCount: 3,
            weightInitializer: new RandomWeightInitializer(0.01),
            unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
            activation: new Linear()
        }
        
        return {
            inputs: 4,
            optimizer: () => new SGDNesterovMomentum(0.00001, 0.9), // start with 0.1, then 0.01 then 0.001
            errorFunction: new MSE(),
            layerConfigs: [
                carHiddenEmulatorLayer,
                carOutputEmulatorLayer
            ]
        }
        
    }

    private getTruckNet(): NetConfig {
        const hiddenEmulatorLayer = {
            neuronCount: 45,
            weightInitializer: new TwoLayerInitializer(0.7, 45),
            unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
            activation: new Tanh()
        }
        
        const outputEmulatorLayer = {
            neuronCount: 6,
            weightInitializer: new TwoLayerInitializer(0.7, 6),
            unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
            activation: new Linear()
        }
        
        return {
            inputs: 7,
            // TODO: was trained with 0.1 then 0.01 after improvement stops => basically decay
            optimizer: () => new SGD(0.01), //new SGDNesterovMomentum(0.1, 0.9),
            errorFunction: new MSE(),
            layerConfigs: [
                hiddenEmulatorLayer,
                outputEmulatorLayer
            ]
        }
    }

    public handleResetNetwork() {
        this.setState({ network: this.getDefaultNetConfig()})
    }

    public onNetworkChange(net: NetConfig, keepWeights: boolean) {
        console.log("New network received!");
        console.log(net);
        console.log(net.layerConfigs);
        let nn = this.state.nn;
        if (keepWeights && this.state.nn) {
            let weights = this.state.nn.getWeights();
            nn = new NeuralNet(net);
            nn.loadWeights(weights);
        } else {
            nn = undefined;
        }
        this.setState({ network: net, nn: nn});
    }

    public render() {
        let mse = new MSE();
        let errorFunctions: { [key: string]: ErrorFunction} = {
        }
        errorFunctions[mse.getName()] = mse;

        let optimizers: { [key: string]: () => Optimizer} = {};
        let sgd = new SGD(0.5);
        let nesterov = new SGDNesterovMomentum(0.5, 0.9);
        optimizers[sgd.getName()] = () => new SGD(0.5);
        optimizers[nesterov.getName()] = () => new SGDNesterovMomentum(0.5, 0.9);

        let weightInitializers: { [key: string]: WeightInitializer} = {};
        let random = new RandomWeightInitializer(0.5);
        let twoLayer = new TwoLayerInitializer(0.7, 25);
        weightInitializers[random.getName()] = random;
        weightInitializers[twoLayer.getName()] = twoLayer;

        let activations: { [key: string]: ActivationFunction} = {}
        activations[new Tanh().getName()] = new Tanh();
        activations[new Sigmoid().getName()] = new Sigmoid();
        activations[new ReLu(0.01).getName()] = new ReLu(0.01);
        activations[new Linear().getName()] = new Linear();

        let loadingModal = undefined;
        if (this.state.loadingWeights) {
            loadingModal = <LoadingModal headerText={"Loading weights..."} />
        }   
        let alert = undefined;

        if (this.state.loadWeightsSuccessful !== null) {
            if (this.state.loadWeightsSuccessful) {
                alert = <div className="alert alert-success" role="alert">
                <strong>Weights loaded!</strong>
              </div>
            } else {
                alert = <div className="alert alert-danger" role="alert">
                <strong>Failed to load weights!</strong> Make sure that the network has 4
                 inputs, 45 neurons in the hidden layer and 3 outputs.<br />{this.state.loadWeightsFailureMsg}
              </div>
            }
        }

        return <div className="container">
                {loadingModal}
                <div className="row">
                    <div className="h3 btn-toolbar">
                        <button type="button"  onClick={this.handleTrain.bind(this)} className="btn btn-primary">Train</button>
                        <button type="button"  onClick={this.handleLoadPretrainedWeights.bind(this)} className="btn btn-warning">Load pretrained weights</button>
                        <button type="button"  onClick={this.handleResetNetwork.bind(this)} className="btn btn-danger">Reset Network</button>
                    </div>
                    {alert}
                </div>
                <div className="row">
                    <NetworkCreator activations={activations} weightInitializers={weightInitializers} optimizers={optimizers} network={this.state.network} onChange={this.onNetworkChange.bind(this)} errorFunctions={errorFunctions} />
                </div>
            </div>
    }
}