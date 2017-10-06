import { suite, test, slow, timeout } from "mocha-typescript";
import {expect} from 'chai'
import {Layer} from '../../src/neuralnet/layer'
import {Linear, Tanh} from '../../src/neuralnet/activation'
import {AdalineUnit} from '../../src/neuralnet/unit';
import {Vector} from '../../src/neuralnet/math'

@suite
class LayerTest {
    private layer: Layer;
    before() {
        this.layer = new Layer(2, 2, new Tanh(), (inputDim, activation) => new AdalineUnit(inputDim, activation) )
        let units = this.layer.getUnits();
        units[0].setWeights(new Vector([-0.1, -0.2, -0.1]))
        units[1].setWeights(new Vector([0.2, 0.3, 0.2]))
    }

    @test
    public testForward() {
        let result = this.layer.forward(new Vector([2,3]));
        expect(result.length).to.equal(2);
        expect(result.entries[0]).to.equal(Math.tanh(-0.9));
        expect(result.entries[1]).to.equal(Math.tanh(1.5));
    }

    @test
    public testBackward() {
        let result = this.layer.forward(new  Vector([2, 3]));

        let errorDerivative = new Vector([result.entries[0] - (-1), result.entries[1] - 1]);
        let inputDerivative = this.layer.backward(errorDerivative, 0.01, false);
        
        // calculate weight updates
        let units = this.layer.getUnits();
        // for unit 1
        let x_1 = errorDerivative.entries[0] * (1 - result.entries[0] * result.entries[0]);
        let w_11 = x_1 * 2
        let w_21 = x_1 * 3
        let w_31 = x_1 * 1
        let update1 = units[0].getLastUpdate();
        
        expect(update1.entries[0], 'W_11').to.equal(w_11 * -0.01);
        expect(update1.entries[1], 'W_21').to.equal(w_21 * -0.01);
        expect(update1.entries[2], 'W_31').to.equal(w_31 * -0.01);
        
        // for unit 2
        let x_2 = errorDerivative.entries[1] * (1 - result.entries[1] * result.entries[1]);
        let w_12 = x_2 * 2
        let w_22 = x_2 * 3
        let w_32 = x_2 * 1

        let update2 = units[1].getLastUpdate();
        expect(update2.entries[0], "W_12").to.equal(w_12 * -0.01);
        expect(update2.entries[1], "W_22").to.equal(w_22 * -0.01);
        expect(update2.entries[2], "W_32").to.equal(w_32 * -0.01);
        // y derivatives
        let y_1 = x_1 * -0.1 + x_2 * 0.2
        let y_2 = x_1 * -0.2 + x_2 * 0.3
        expect(y_1, "Y_1 should be this.").to.equal(-0.017242017295460453)
        expect(y_2, "Y_2 should be this").to.equal(-0.03277000056293344)
        

        expect(inputDerivative.length).to.equal(2);
        expect(inputDerivative.entries[0]).to.equal(y_1);
        expect(inputDerivative.entries[1]).to.equal(y_2);
    }
}
