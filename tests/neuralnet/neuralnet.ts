import { suite, test, slow, timeout } from "mocha-typescript";
import {expect} from 'chai'
import {Layer} from '../../src/neuralnet/layer'
import {Linear, Tanh, Sigmoid, ActivationFunction} from '../../src/neuralnet/activation'
import {AdalineUnit} from '../../src/neuralnet/unit';
import {Vector} from '../../src/neuralnet/math'
import {NeuralNet, LayerConfig, NetConfig} from '../../src/neuralnet/net'
import {MSE} from '../../src/neuralnet/error'

var hiddenLayer: LayerConfig = {
    neuronCount: 2,
    unitConstructor: (input: number, activation: ActivationFunction) => new AdalineUnit(input, activation),
    activation: new Sigmoid()
}

var outputLayer: LayerConfig = {
    neuronCount: 1,
    unitConstructor: (inputDim: number, activation: ActivationFunction) => new AdalineUnit(inputDim, activation),
    activation: new Sigmoid()
}

var netConfig: NetConfig = {
    inputs: 2,
    learningRate: 0.45,
    errorFunction: new MSE(),
    layerConfigs: [
        hiddenLayer,
        outputLayer
    ]
}


@suite
class NeuralNetTest {
    private net: NeuralNet
    before() {
        this.net = new NeuralNet(netConfig)
        let layers = this.net.getLayers();
        let hiddenLayerUnits = layers[0].getUnits();
        hiddenLayerUnits[0].setWeights(new Vector([0.4, 0.1, 0]))
        hiddenLayerUnits[1].setWeights(new Vector([-0.1, -0.1, 0]))

        let outputLayerUnits = layers[1].getUnits();
        outputLayerUnits[0].setWeights(new Vector([0.06, -0.4, 0]))
    }

    @test
    public testForward() {
        let result = this.net.forward(new Vector([1, 1]))

        expect(result.length).to.equal(1)
        expect(result.entries[0]).to.equal(0.46438072894227506)
    }

    @test
    public testBackward() {
        let result = this.net.forward(new Vector([1, 1]))

        let inputDerivative = this.net.backward(result, new Vector([1]))

        let layers = this.net.getLayers();
        let outputUnit = layers[1].getUnits()[0];
        let outputWeights = outputUnit.getWeights();
        expect(outputWeights[0]).to.equal(0.09731728786440721);
        expect(outputWeights[1]).to.equal(-0.37301193272077066);

        let hiddenLayer = layers[0]
        let hiddenLayerUnits = hiddenLayer.getUnits();

        let unit1Weights = hiddenLayerUnits[0].getWeights();
        expect(unit1Weights[0]).to.equal(0.4008453276290837)
        expect(unit1Weights[1]).to.equal(0.10084532762908367);


        let unit2Weights = hiddenLayerUnits[1].getWeights();
        let wu = hiddenLayerUnits[1].getLastUpdate()
        expect(wu.entries[0]).to.equal(-0.022368)
        expect(wu.entries[1]).to.equal(-0.022368)
        
        expect(unit2Weights[0]).to.equal(-0.122368);
        expect(unit2Weights[1]).to.equal(-0.122368);
        
        let result2 = this.net.forward(new Vector([1,1]))
        expect(result2.entries[0]).to.equal(0.474186972)
    }
}


