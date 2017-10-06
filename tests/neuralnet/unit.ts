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
}