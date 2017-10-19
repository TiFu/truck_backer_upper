import { suite, test, slow, timeout } from "mocha-typescript";
import {expect} from 'chai'
import {AdalineUnit} from '../../src/neuralnet/unit';
import {Vector} from '../../src/neuralnet/math'
import {Linear, Tanh} from '../../src/neuralnet/activation'


@suite
class UnitTest {
    private unitLinear: AdalineUnit;
    private unitTanh: AdalineUnit;

    before() {
        this.unitLinear = new AdalineUnit(2, new Linear());
        this.unitLinear.setWeights(new Vector([3,7,2]));
        this.unitTanh = new AdalineUnit(2, new Tanh());
        this.unitTanh.setWeights(new Vector([3,7,2]));
    }

    @test
    public testForwardLinear() {
        let result = this.unitLinear.forward(new Vector([8,5]))
        expect(result).to.equal(61)
    }

    @test
    public testForwardTanh() {
        let result = this.unitTanh.forward(new Vector([0.1,0.01]))
        expect(result).to.equal(Math.tanh(2.37))
    }

    @test
    public testBackward() {
        let forward = this.unitTanh.forward(new Vector([0.1, 0.01]))
        expect(forward).to.equal(Math.tanh(2.37));
        let errorDerivative = forward - (-1); // is - should 
        let inputDerivative = this.unitTanh.backward(errorDerivative, 0.01,false);
        
        let expectedDx = errorDerivative * (1 - Math.tanh(2.37) * Math.tanh(2.37))

        let e1 = -0.01 * expectedDx * 0.1;
        let e2 = -0.01 * expectedDx * 0.01;
        let e3 = -0.01 * expectedDx * 1;
        // we check that the input derivative is correct
        let lastUpdate = this.unitTanh.getLastUpdate();
        expect(lastUpdate.entries[0], 'First Update Parameter').to.equal(e1);
        expect(lastUpdate.entries[1], 'Second Update Parameter').to.equal(e2);
        expect(lastUpdate.entries[2], 'Third update parameter').to.equal(e3);
        let weights = this.unitTanh.getWeights();
        expect(weights[0], 'Weight update 1 is incorrect.').to.equal(3 + e1);
        expect(weights[1], 'Weight update 2 is incorrect.').to.equal(7 + e2);
        expect(weights[2], 'Weight update 3 is incorrect').to.equal(2 + e3);

        expect(inputDerivative.length).to.equal(2);
        expect(inputDerivative.entries[0]).to.equal(expectedDx * 3);
        expect(inputDerivative.entries[1]).to.equal(expectedDx * 7);
    }

    @test
    public testBackwardGradientChecking() {
        let vec = new Vector([0.1, 0.01]);
        let forward = this.unitTanh.forward(vec);
        console.log(this.unitTanh.getWeights());
        expect(forward).to.equal(Math.tanh(2.37));

        let firstGradient = this.gradientCheckInputs(vec, 0, this.unitTanh);
        let secondGradient = this.gradientCheckInputs(vec, 1, this.unitTanh);

        let firstWeight = this.gradientCheckWeights(vec, 0, this.unitTanh);
        let secondWeight = this.gradientCheckWeights(vec, 1, this.unitTanh);
        let thirdWeight = this.gradientCheckWeights(vec, 2, this.unitTanh);

        const learningRate = 0.01;
        const inputDerivative = this.unitTanh.backward(1, learningRate, false);

        expect(Math.abs(firstGradient - inputDerivative.entries[0]) < 10e-4).to.be.true;
        expect(Math.abs(secondGradient - inputDerivative.entries[1]) < 10e-4).to.be.true;

        let update = this.unitTanh.getLastUpdate();

        // that's diff because update.entries[0] is der * (-1) * learningRate
        expect(Math.abs(firstWeight + 1 / learningRate * update.entries[0]) < 10e-4, "First Weight incorrect").to.be.true;
        expect(Math.abs(secondWeight + 1 / learningRate * update.entries[1]) < 10e-4, "First Weight incorrect").to.be.true;
        expect(Math.abs(thirdWeight + 1 / learningRate * update.entries[2]) < 10e-4, "First Weight incorrect").to.be.true;
    }

    private gradientCheckWeights(vec: Vector, entry: number, unit: AdalineUnit) {
        let newWeights = unit.getWeights();
        console.log(newWeights)
        console.log(vec);
        newWeights[entry] += 10e-6
        let a = unit.forward(vec);
        newWeights[entry] -= 2 * 10e-6;
        let b = unit.forward(vec);
        newWeights[entry] += 10e-6;
        return (a - b) / (2 * 10e-6);
    }

    private gradientCheckInputs(vec: Vector, entry: number, unit: AdalineUnit): number {
        let b = new Vector(vec.entries.slice());
        b.entries[entry] += 10e-6;
        let c = new Vector(vec.entries.slice());
        c.entries[entry] -= 10e-6;
        
        return (unit.forward(b) - unit.forward(c)) / (2 * 10e-6)
    }
}