import * as React from 'react'
import { Truck, NormalizedTruck} from '../model/truck';
import { NetworkCreator } from './NetworkCreator';

import {NetConfig} from '../neuralnet/net';
import { MSE, ErrorFunction } from '../neuralnet/error';
import { SGD, Optimizer, SGDNesterovMomentum } from '../neuralnet/optimizers';
import {RandomWeightInitializer, TwoLayerInitializer, WeightInitializer} from '../neuralnet/weightinitializer';
import {Tanh, Sigmoid, ActivationFunction, ReLu, Linear} from '../neuralnet/activation';
import {AdalineUnit} from '../neuralnet/unit';
import {NeuralNet} from '../neuralnet/net';
import {TrainTruckEmulator} from '../neuralnet/train';
const ReactHighcharts = require('react-highcharts');

interface EmulatorProps {
    object: Truck;
    onNetworkChange: (nn: NeuralNet) => void;
}

interface EmulatorState {
    network: NetConfig;
    nn: NeuralNet;
    loadingWeights: boolean;
    loadWeightsSuccessful: boolean | null;
    loadWeightsFailureMsg: string | null;
    train: boolean;
    isTrainedNetwork: boolean;
    errors: number[];
}

export class Emulator extends React.Component<EmulatorProps, EmulatorState> {
    private emulatorTrainer: TrainTruckEmulator;
    private i = 0;
    public STEPS_PER_FRAME = 10;
    public readonly STEPS_PER_ERROR = 100;
    private lastIteration: number = undefined;

    private errorCache: number[] = [];
    private errorCount: number;
    private errorSum: number;

    public constructor(props: EmulatorProps) {
        super(props);
        this.state = { 
            network: this.getDefaultNetConfig(),
            nn: undefined,
            loadingWeights: false,
            loadWeightsSuccessful: null,
            loadWeightsFailureMsg: null,
            isTrainedNetwork: false,
            train: false,
            errors: []
        };
    }

    public handleTrain() {
        let nn = this.state.nn;
        if (!this.state.nn) {
            nn = new NeuralNet(this.state.network);
        }
        this.setState({nn: nn, train: true},() => {
            // we updated the gui
            // start animation
            let normalizedObject = new NormalizedTruck(this.props.object);
            this.emulatorTrainer = new TrainTruckEmulator(normalizedObject, this.state.nn, 1);   
            this.lastIteration = performance.now();     
            this.errorCache = [];
            this.errorSum = 0;
            this.errorCount = 0;
            requestAnimationFrame(this.trainNeuralNetAniFrame);
        });
    }

    private trainNeuralNetAniFrame = this.trainNeuralNetCallback.bind(this);
    private trainNeuralNetCallback() {
        let i = 0;
        for (let i = 0; i < this.STEPS_PER_FRAME; i++) {
            this.props.object.randomizeNoLimits();
            let error = [0, 0];
            try {
                error = this.emulatorTrainer.train(1);
            } catch (e) {
                this.setState({ train: false }, () => {
                    alert("Error in Training: " + e);
                })
                return;
            }
            this.errorCount++;
            this.errorSum += error[1];

            if (this.errorCount > 0 && this.errorCount % this.STEPS_PER_ERROR === 0) {
                this.errorCache.push(this.errorSum / this.STEPS_PER_ERROR);
                (this.refs.chart as any).getChart().series[0].addPoint(this.errorSum / this.STEPS_PER_ERROR, true);

                this.errorCount = 0;
                this.errorSum = 0;
            }
        }


        // dynamically adjust steps per frame;
        let duration = performance.now() - this.lastIteration;
        this.lastIteration = performance.now();
        if (duration > 1.05 * 1000 / 60) {
            this.STEPS_PER_FRAME = Math.min(1, this.STEPS_PER_FRAME);
        } else if (duration < 0.95 * 1000/60){ 
            this.STEPS_PER_FRAME += 1;
        }

        if (this.state.train) {
            requestAnimationFrame(this.trainNeuralNetAniFrame);
        }
    }

    public handleLoadPretrainedWeights() {
        let weightName = "truck_emulator_weights";

        $.ajax({
            url: "weights/" + weightName,
            dataType: "text",
            mimeType: "application/json",
            success: (data) => {
                let network = this.getDefaultNetConfig();
                let neuralNet = new NeuralNet(network);

                try {
                    neuralNet.loadWeights(JSON.parse(data));
                    this.setState({
                        loadingWeights: false, 
                        network: network,
                        nn: neuralNet, 
                        loadWeightsSuccessful: true });
                    this.props.onNetworkChange(neuralNet);
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
        return this.getTruckNet();
    }

    private getTruckNet(): NetConfig {
        const hiddenEmulatorLayer = {
            neuronCount: 100,
            weightInitializer: new TwoLayerInitializer(0.7, 45),
            unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
            activation: new Tanh()
        }
        
        const outputEmulatorLayer = {
            neuronCount: 4,
            weightInitializer: new TwoLayerInitializer(0.7, 6),
            unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
            activation: new Linear()
        }
        
        return {
            inputs: 5,
            // TODO: was trained with 0.1 then 0.01 after improvement stops => basically decay
            optimizer: () => new SGD(0.0001), //new SGDNesterovMomentum(0.1, 0.9),
            errorFunction: new MSE(),
            layerConfigs: [
                hiddenEmulatorLayer,
                outputEmulatorLayer
            ]
        }
    }

    public handleResetNetwork() {
        this.setState({ network: this.getDefaultNetConfig(), nn: undefined, loadWeightsSuccessful: null, loadWeightsFailureMsg: null, loadingWeights: false}, () => {
            this.props.onNetworkChange(null);
        })
    }

    public onNetworkChange(net: NetConfig, keepWeights: boolean) {
        let nn = this.state.nn;
        let errors = this.state.errors;
        let isTrained = this.state.isTrainedNetwork;

        if (keepWeights && this.state.nn) {
            let weights = this.state.nn.getWeights();
            nn = new NeuralNet(net);
            nn.loadWeights(weights);
        } else {
            nn = undefined;
            errors = undefined;
            isTrained = false;
        }
        this.setState({ network: net, nn: nn, errors: errors, isTrainedNetwork: isTrained, loadWeightsSuccessful: null, loadWeightsFailureMsg: null, loadingWeights: false});
    }

    private renderConfigureEmulator() {
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

        let alert = undefined;

        if (this.state.loadWeightsSuccessful !== null) {
            if (this.state.loadWeightsSuccessful) {
                alert = <div className="row alert alert-success" role="alert">
                <strong>Network loaded!</strong>
              </div>
            } else {
                alert = <div className="row alert alert-danger" role="alert">
                <strong>Failed to load weights!</strong> Make sure that the network has 4
                 inputs, 45 neurons in the hidden layer and 3 outputs.<br />{this.state.loadWeightsFailureMsg}
              </div>
            }
        }

        let trainButton = <button type="button"  onClick={this.handleTrain.bind(this)} className="btn btn-primary">Train</button>;
        if (this.state.train) {
            trainButton = <button type="button"  disabled={!this.state.train} onClick={this.handleStopTrain.bind(this)} className="btn btn-danger">Stop</button>;
        }
        let diagram = undefined;
        if (this.state.train || this.state.isTrainedNetwork) {
            diagram = this.getErrorDiagram()
        }
        return <div className="container">
                <div className="row">
                    <div className="h3 btn-toolbar">
                        {trainButton}
                        <button type="button"  onClick={this.handleLoadPretrainedWeights.bind(this)} disabled={this.state.train} className="btn btn-warning">Load pretrained Network</button>
                        <button type="button"  onClick={this.handleResetNetwork.bind(this)} disabled={this.state.train} className="btn btn-danger">Reset Network</button>
                    </div>
                </div>
                {alert}
                <div className="row">
                    <div className="col-sm-12">
                        {diagram}
                    </div>
                </div>
                <div className="row">
                    <NetworkCreator disabled={this.state.train} showOptimizer={true} showInfo={true} activations={activations} weightInitializers={weightInitializers} optimizers={optimizers} network={this.state.network} onChange={this.onNetworkChange.bind(this)} errorFunctions={errorFunctions} />
                </div>
            </div>
    }

    public componentWillUnmount() {
        // stop training if we unmount
        if (this.state.train) {
            this.handleStopTrain();
        }
    }

    private handleStopTrain() {
        this.errorCache = [];
        this.setState({train: false, isTrainedNetwork: true, nn: this.state.nn, errors: this.state.errors});
        this.props.onNetworkChange(this.state.nn);
    }

    private getErrorDiagram() {
        let config = {
            title: {
                text: "Emulator Error"
            },
            plotOptions: {
                line: {
                    animation: false
                }
            },
            xAxis: {
                labels: {
                    formatter: function() {
                        return (this.value * 100 + 100).toFixed(0);
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: "Error"
                }
            },
            series: [
                {
                    name: "Error",
                    data: this.state.errors
                }
            ]
        }
        return <ReactHighcharts
            config={config}
            ref="chart"
        />;
    }


    public render() {
        return this.renderConfigureEmulator();
    }
}