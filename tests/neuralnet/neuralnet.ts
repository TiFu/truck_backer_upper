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
    unitConstructor: (input: number, activation: ActivationFunction, initialWeightRange: number) => new AdalineUnit(input, activation, initialWeightRange),
    activation: new Sigmoid()
}

var outputLayer: LayerConfig = {
    neuronCount: 1,
    unitConstructor: (inputDim: number, activation: ActivationFunction, initialWeightRange: number) => new AdalineUnit(inputDim, activation, initialWeightRange),
    activation: new Sigmoid()
}

var netConfig: NetConfig = {
    inputs: 2,
    learningRate: 0.45,
    weightInitRange: 0.6,
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
        let outputUpdate = outputUnit.getLastUpdate();
        expect(outputUpdate.entries[0]).to.equal(0.037317287864407224);
        expect(outputUpdate.entries[1]).to.equal(0.026988067279229387);
        let outputWeights = outputUnit.getWeights();
        expect(outputWeights[0]).to.equal(0.09731728786440721);
        expect(outputWeights[1]).to.equal(-0.37301193272077066);

        let hiddenLayer = layers[0]
        let hiddenLayerUnits = hiddenLayer.getUnits();

        let unit1Weights = hiddenLayerUnits[0].getWeights();
        let unit1Updates = hiddenLayerUnits[0].getLastUpdate();
        expect(unit1Updates.entries[0]).to.equal(0.0008453276290836732);
        expect(unit1Updates.entries[1]).to.equal(0.0008453276290836732);
        expect(unit1Weights[0]).to.equal(0.4008453276290837)
        expect(unit1Weights[1]).to.equal(0.10084532762908367);

        let unit2Weights = hiddenLayerUnits[1].getWeights();
        let wu = hiddenLayerUnits[1].getLastUpdate()
        expect(wu.entries[0]).to.equal(-0.005935582764750712)
        expect(wu.entries[1]).to.equal(-0.005935582764750712);
        
        expect(unit2Weights[0]).to.equal(-0.10593558276475072);
        expect(unit2Weights[1]).to.equal(-0.10593558276475072);
        
        let result2 = this.net.forward(new Vector([1,1]))
        expect(result2.entries[0]).to.equal(0.4885796481617482);
    }

    @test
    public backwardGradientChecking() {
        let mse = new MSE();
        let result1 = mse.getError(this.net.forward(new Vector([1+10e-6, 1])), new Vector([1]));
        let result2 = mse.getError(this.net.forward(new Vector([1 - 10e-6, 1])), new Vector([1]))
        let der1 = (result1 - result2) / (2 * 10e-6);

        let result3 = mse.getError(this.net.forward(new Vector([1, 1+10e-6])), new Vector([1]));
        let result4 = mse.getError(this.net.forward(new Vector([1, 1 - 10e-6])), new Vector([1]));
        let der2 = (result3 - result4) / (2 * 10e-6);

        let result = this.net.forward(new Vector([1, 1]))
        let inputDerivative = this.net.backward(result, new Vector([1]))
        
        expect(Math.abs(der1 - inputDerivative.entries[0]) < 10e-7).to.be.true;
        expect(Math.abs(der2 - inputDerivative.entries[1]) < 10e-7).to.be.true;
    }

    public xOR() {
        var hiddenLayer: LayerConfig = {
            neuronCount: 2,
            unitConstructor: (input: number, activation: ActivationFunction, initialWeightRange: number) => new AdalineUnit(input, activation, initialWeightRange),
            activation: new Sigmoid()
        }
        
        var outputLayer: LayerConfig = {
            neuronCount: 1,
            unitConstructor: (inputDim: number, activation: ActivationFunction, initialWeightRange: number) => new AdalineUnit(inputDim, activation, initialWeightRange),
            activation: new Sigmoid()
        }
        
        var netConfig: NetConfig = {
            inputs: 2,
            learningRate: 0.05,
            weightInitRange: 0.6,            
            errorFunction: new MSE(),
            layerConfigs: [
                hiddenLayer,
                outputLayer
            ]
        }
        
        let input = [new Vector([0, 0]), new Vector([1, 0]), new Vector([0, 1]), new Vector([1, 1])];
        let desiredOutput = [new Vector([0]), new Vector([1]), new Vector([1]), new Vector([0])];

        let net = new NeuralNet(netConfig);

        for (let i = 0; i < 100000; i++) {
            let error = 0;
            for (let i = 0; i < input.length; i++){ 
                let fw = net.forward(input[i]);
                let bw = net.backward(fw, desiredOutput[i])
                error += net.errors[net.errors.length - 1];
            }

            if (error < 0.01) {
                expect(error < 0.01).to.be.true;
                return;
            }
        }
        expect(true, "The network did not converge").to.be.false;
    }
}


