import * as React from 'react'
import {Simulation} from './Simulation'
import { Car, NormalizedCar } from "../model/car";
import { Point } from "../math";
import { Dock } from "../model/world";
import { Truck, NormalizedTruck} from '../model/truck';
import { NetworkCreator } from './NetworkCreator';

import {NetConfig} from '../neuralnet/net';
import { MSE, ErrorFunction } from '../neuralnet/error';
import { SGD, Optimizer, SGDNesterovMomentum } from '../neuralnet/optimizers';
import {RandomWeightInitializer, TwoLayerInitializer, WeightInitializer} from '../neuralnet/weightinitializer';
import {Tanh, Sigmoid, ActivationFunction, ReLu, Linear} from '../neuralnet/activation';
import {AdalineUnit} from '../neuralnet/unit';
import { LoadingModal } from './LoadingModal';
import {NeuralNet} from '../neuralnet/net';
import {TrainTruckEmulator} from '../neuralnet/train';
const ReactHighcharts = require('react-highcharts');

interface EmulatorProps {
    object: Car | Truck;
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
            let normalizedObject = this.props.object instanceof Car ? new NormalizedCar(this.props.object): new NormalizedTruck(this.props.object);
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
            let error = this.emulatorTrainer.train(1);
            this.errorCount++;
            this.errorSum += error[1];

            if (this.errorCount > 0 && this.errorCount % this.STEPS_PER_ERROR === 0) {
                console.log("Error: ", this.errorSum/this.STEPS_PER_ERROR, "Count: ", this.errorCache.length * 100);
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
        let weightName = "car_emulator_weights";
        if (this.props.object instanceof Truck) {
            weightName = "truck_emulator_weights";
        }
        $.ajax({
            url: "weights/" + weightName,
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
        this.setState({ network: this.getDefaultNetConfig(), nn: undefined}, () => {
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
        this.setState({ network: net, nn: nn, errors: errors, isTrainedNetwork: isTrained});
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

        let trainButton = <button type="button"  onClick={this.handleTrain.bind(this)} className="btn btn-primary">Train</button>;
        if (this.state.train) {
            trainButton = <button type="button"  disabled={!this.state.train} onClick={this.handleStopTrain.bind(this)} className="btn btn-danger">Stop</button>;
        }
        let diagram = undefined;
        if (this.state.train || this.state.isTrainedNetwork) {
            diagram = <div className="row">
            {this.getErrorDiagram()}
        </div>;
        }
        return <div className="container">
                {loadingModal}
                <div className="row">
                    <div className="h3 btn-toolbar">
                        {trainButton}
                        <button type="button"  onClick={this.handleLoadPretrainedWeights.bind(this)} className="btn btn-warning">Load pretrained weights</button>
                        <button type="button"  onClick={this.handleResetNetwork.bind(this)} className="btn btn-danger">Reset Network</button>
                    </div>
                   {alert}
                </div>
                {diagram}
                <div className="row">
                    <NetworkCreator showOptimizer={true} showInfo={true} activations={activations} weightInitializers={weightInitializers} optimizers={optimizers} network={this.state.network} onChange={this.onNetworkChange.bind(this)} errorFunctions={errorFunctions} />
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
        console.log("pushing error cache");
        // Temporary HACK: do not duplicate error entries
     //   this.state.errors.push(...this.errorCache);
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