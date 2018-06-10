import * as React from 'react'
import {Simulation} from './Simulation'
import { Car, NormalizedCar } from "../model/car";
import { Point } from "../math";
import { Dock, World } from "../model/world";
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
import {TrainTruckEmulator, TrainController} from '../neuralnet/train';
import {CarControllerError, TruckControllerError} from '../neuralnet/error';
import {NeuralNetEmulator} from '../neuralnet/emulator';
import { Lesson } from '../neuralnet/lesson';
import {createCarControllerLessons} from '../neuralnet/lesson';
import {LayerConfig} from '../neuralnet/net';
import {LessonsComponent} from './LessonComponent'
import { ENGINE_METHOD_DIGESTS } from 'constants';
const ReactHighcharts = require('react-highcharts');

interface ControllerProps {
    object: Car | Truck;
    world: World;
    emulatorNet: NeuralNet;
    onControllerTrained: (net: TrainController) => void;
}

interface ControllerState {
    network: NetConfig;
    nn: NeuralNet;
    loadingWeights: boolean;
    loadWeightsSuccessful: boolean | null;
    loadWeightsFailureMsg: string | null;
    train: boolean;
    isTrainedNetwork: boolean;
    errors: number[];
    lessons: Lesson[];
    currentLessonIndex: number;
}

export class Controller extends React.Component<ControllerProps, ControllerState> {
    private emulatorController: TrainController;
    private i = 0;
    public STEPS_PER_FRAME = 10;
    public readonly STEPS_PER_ERROR = 100;
    private lastIteration: number = undefined;

    private errorCache: number[] = [];
    private errorCount: number;
    private errorSum: number;
    private currentLessonSteps: number = 0;

    public constructor(props: ControllerProps) {
        super(props);
        this.state = { 
            network: this.getDefaultNetConfig(),
            nn: undefined,
            loadingWeights: false,
            loadWeightsSuccessful: null,
            loadWeightsFailureMsg: null,
            isTrainedNetwork: false,
            train: false,
            errors: [],
            lessons: this.props.object instanceof Car ? createCarControllerLessons(this.props.object) : [],
            currentLessonIndex: 0
        };
        this.handleLoadPretrainedWeights();
    }

    private handleResetLessons() {
        this.setState({ lessons: this.props.object instanceof Car ? createCarControllerLessons(this.props.object) : []})        
    }

    private handleStopTrain() {
        console.log("pushing error cache");
        // Temporary HACK: do not duplicate error entries
     //   this.state.errors.push(...this.errorCache);
        this.errorCache = [];
        this.setState({train: false, isTrainedNetwork: true, nn: this.state.nn, errors: this.state.errors}, () => {
            this.props.onControllerTrained(this.makeTrainController());
        });
    }

    public handleTrain() {
        // TODO: disable train button, show hover hint!
        if (this.props.emulatorNet === undefined) {
            alert("You need to load emulator weights or train an emulator net before using the controller!");
            return;
        }

        let nn = this.state.nn;
        if (!this.state.nn) {
            console.log("creating nn")
            nn = new NeuralNet(this.state.network);
        }
        this.setState({nn: nn, train: true},() => {
            // we updated the gui
            // start animation
            this.emulatorController = this.makeTrainController();
            this.emulatorController.setLesson(this.state.lessons[this.state.currentLessonIndex]);
            this.lastIteration = performance.now();     
            this.errorCache = [];
            this.errorSum = 0;
            this.errorCount = 0;
            requestAnimationFrame(this.trainNeuralNetAniFrame);
        });
    }

    private makeTrainController(): TrainController {
        let normalizedObject = this.props.object instanceof Car ? new NormalizedCar(this.props.object): new NormalizedTruck(this.props.object);
        let error = this.props.object instanceof Car ? new CarControllerError(this.props.world.dock.position) : new TruckControllerError(this.props.world.dock.position)
        // TODO: offer option to use jacobi matrix if object is car
        return new TrainController(this.props.world, normalizedObject, this.state.nn, new NeuralNetEmulator(this.props.emulatorNet), error);   
    }

    private trainNeuralNetAniFrame = this.trainNeuralNetCallback.bind(this);
    private trainNeuralNetCallback() {

        for (let i = 0; i < this.STEPS_PER_FRAME; i++) {
            this.props.object.randomizeNoLimits();
            let error = this.emulatorController.trainSingleStep();
            this.errorCount++;
            this.errorSum += error;

            if (this.errorCount > 0 && this.errorCount % this.STEPS_PER_ERROR === 0) {
                console.log("Error: ", this.errorSum/this.STEPS_PER_ERROR, "Count: ", this.errorCache.length * 100);
                this.errorCache.push(this.errorSum / this.STEPS_PER_ERROR);
                (this.refs.chart as any).getChart().series[0].addPoint(this.errorSum / this.STEPS_PER_ERROR, true);

                this.errorCount = 0;
                this.errorSum = 0;
            }
        }

        // TODO: chart disable decimals
        if (this.currentLessonSteps + this.STEPS_PER_FRAME >= this.state.lessons[this.state.currentLessonIndex].samples) {
            console.error("Setting lesson to " + (this.state.currentLessonIndex + 1))
            this.emulatorController.setLesson(this.state.lessons[this.state.currentLessonIndex + 1]);
            this.currentLessonSteps = 0;
            this.setState({currentLessonIndex: this.state.currentLessonIndex + 1});
        } else {
            this.currentLessonSteps += this.STEPS_PER_FRAME;
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
        let weightName = "car_controller_weights_11";
        if (this.props.object instanceof Truck) {
            weightName = "truck_controller_weights_11";
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
                        loadWeightsSuccessful: true }, () => {
                            this.props.onControllerTrained(this.makeTrainController());
                        });
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
        const hiddenCarControllerLayer: LayerConfig = {
            neuronCount: 26,
        //    weightInitializer: RandomWeightInitializer(0.1),
            weightInitializer: new TwoLayerInitializer(0.7, 26),
            unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
            activation: new Tanh()
        }
        
        const outputCarControllerLayer: LayerConfig = {
            neuronCount: 1,
            weightInitializer: new RandomWeightInitializer(0.1),
        //    weightInitializer: TwoLayerInitializer(0.7, 1),
            unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
            activation: new Tanh() // [-1, 1]
        }
        
        return {
            inputs: 3,
            optimizer: () => new SGDNesterovMomentum(0.0001, 0.9),
            errorFunction: new MSE(), // ignored
            layerConfigs: [
                hiddenCarControllerLayer,
                outputCarControllerLayer
            ]
        }
    }

    private getTruckNet(): NetConfig {
        const hiddenControllerLayer: LayerConfig = {
            neuronCount: 26,
            weightInitializer: new TwoLayerInitializer(0.7, 26),
            unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
            activation: new Tanh()
        }
        
        const outputControllerLayer: LayerConfig = {
            neuronCount: 1,
            weightInitializer: new TwoLayerInitializer(0.7, 1),
            unitConstructor: (weights: number, activation: ActivationFunction, initialWeightRange: WeightInitializer, optimizer: Optimizer) => new AdalineUnit(weights, activation, initialWeightRange, optimizer),
            activation: new Tanh() // [-1, 1]
        }
        
        return {
            inputs: 6,
            optimizer: () => new SGD(0.8),
            errorFunction: new MSE(), // ignored
            layerConfigs: [
                hiddenControllerLayer,
                outputControllerLayer
            ]
        }
    }
    // TODO: add visualization for training area from TrainController.lastTrainedLesson
        // i.e. add red square in simulation

    public handleResetNetwork() {
        this.setState({ network: this.getDefaultNetConfig(), nn: undefined}, () => {
            this.props.onControllerTrained(null);
        })
    }

    public onNetworkChange(net: NetConfig, keepWeights: boolean) {
        let nn = this.state.nn;
        let errors = this.state.errors;
        let isTrained = this.state.isTrainedNetwork;
        let currentLesson = this.state.currentLessonIndex;
        if (keepWeights && this.state.nn) {
            let weights = this.state.nn.getWeights();
            nn = new NeuralNet(net);
            nn.loadWeights(weights);
        } else {
            nn = undefined;
            errors = [];
            isTrained = false;
            currentLesson = 0;
        }
        this.setState({ currentLessonIndex: currentLesson, network: net, nn: nn, errors: errors, isTrainedNetwork: isTrained});
    }

    private updateLessons(lessons: Lesson[]) {
        console.log("Updated lessons: ", lessons);
        this.setState({lessons: lessons, currentLessonIndex: 0});
    }

    private getErrorDiagram() {
        let config = {
            title: {
                text: "Controller Error"
            },
            plotOptions: {
                line: {
                    animation: false
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

    private renderController() {
        let mse = undefined;
        if (this.props.object instanceof Car) {
            mse = new CarControllerError(this.props.world.dock.position);
        } else if (this.props.object instanceof Truck) {
            mse = new TruckControllerError(this.props.world.dock.position);
        }

        let errorFunctions: { [key: string]: ErrorFunction} = undefined;
        if (mse != undefined) {
            errorFunctions = {};
            errorFunctions[mse.getName()] = mse;
        }

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
            let lesson = this.state.lessons[this.state.currentLessonIndex];
            diagram = <div className="row">
            Training lesson {lesson.no} for {lesson.samples} samples.
            {this.getErrorDiagram()}
        </div>;
        }
        // TODO: add accordion
        return <div className="container">
                {loadingModal}
                <div className="row">
                    <div className="h3 btn-toolbar">
                        {trainButton}
                        <button type="button"  onClick={this.handleLoadPretrainedWeights.bind(this)} className="btn btn-warning">Load pretrained weights</button>
                        <button type="button"  onClick={this.handleResetNetwork.bind(this)} className="btn btn-danger">Reset Network</button>
                        <button type="button"  onClick={this.handleResetLessons.bind(this)} className="btn btn-danger">Reset Lessons</button>
                    </div>
                   {alert}
                </div>
                {diagram}
                <div className="row">
                    <LessonsComponent object={this.props.object} lessons={this.state.lessons} onChange={this.updateLessons.bind(this)}/>
                </div>
                <div className="row">
                    <NetworkCreator showInfo={false} activations={activations} weightInitializers={weightInitializers} optimizers={optimizers} network={this.state.network} onChange={this.onNetworkChange.bind(this)} errorFunctions={errorFunctions} />
                </div>
            </div>
    }

    public render() {
        console.log("Lesson Count: " + this.state.lessons.length);
        return this.renderController();
    }
}