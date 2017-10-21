"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_typescript_1 = require("mocha-typescript");
const chai_1 = require("chai");
const layer_1 = require("../../src/neuralnet/layer");
const activation_1 = require("../../src/neuralnet/activation");
const unit_1 = require("../../src/neuralnet/unit");
const math_1 = require("../../src/neuralnet/math");
let LayerTest = class LayerTest {
    before() {
        this.layer = new layer_1.Layer(2, 2, new activation_1.Tanh(), (inputDim, activation, initialWeightRange) => new unit_1.AdalineUnit(inputDim, activation, initialWeightRange), 0.6);
        let units = this.layer.getUnits();
        units[0].setWeights(new math_1.Vector([-0.1, -0.2, -0.1]));
        units[1].setWeights(new math_1.Vector([0.2, 0.3, 0.2]));
    }
    testForward() {
        let result = this.layer.forward(new math_1.Vector([2, 3]));
        chai_1.expect(result.length).to.equal(2);
        chai_1.expect(result.entries[0]).to.equal(Math.tanh(-0.9));
        chai_1.expect(result.entries[1]).to.equal(Math.tanh(1.5));
    }
    testBackward() {
        let result = this.layer.forward(new math_1.Vector([2, 3]));
        let errorDerivative = new math_1.Vector([result.entries[0] - (-1), result.entries[1] - 1]);
        let inputDerivative = this.layer.backward(errorDerivative, 0.01, false);
        let units = this.layer.getUnits();
        let x_1 = errorDerivative.entries[0] * (1 - result.entries[0] * result.entries[0]);
        let w_11 = x_1 * 2;
        let w_21 = x_1 * 3;
        let w_31 = x_1 * 1;
        let update1 = units[0].getLastUpdate();
        chai_1.expect(update1.entries[0], 'W_11').to.equal(w_11 * -0.01);
        chai_1.expect(update1.entries[1], 'W_21').to.equal(w_21 * -0.01);
        chai_1.expect(update1.entries[2], 'W_31').to.equal(w_31 * -0.01);
        let x_2 = errorDerivative.entries[1] * (1 - result.entries[1] * result.entries[1]);
        let w_12 = x_2 * 2;
        let w_22 = x_2 * 3;
        let w_32 = x_2 * 1;
        let update2 = units[1].getLastUpdate();
        chai_1.expect(update2.entries[0], "W_12").to.equal(w_12 * -0.01);
        chai_1.expect(update2.entries[1], "W_22").to.equal(w_22 * -0.01);
        chai_1.expect(update2.entries[2], "W_32").to.equal(w_32 * -0.01);
        let y_1 = x_1 * -0.1 + x_2 * 0.2;
        let y_2 = x_1 * -0.2 + x_2 * 0.3;
        chai_1.expect(y_1, "Y_1 should be this.").to.equal(-0.017242017295460453);
        chai_1.expect(y_2, "Y_2 should be this").to.equal(-0.03277000056293344);
        chai_1.expect(inputDerivative.length).to.equal(2);
        chai_1.expect(inputDerivative.entries[0]).to.equal(y_1);
        chai_1.expect(inputDerivative.entries[1]).to.equal(y_2);
    }
    testBackwardGradientChecking() {
        let result = this.layer.forward(new math_1.Vector([2, 3]));
        let errorFunction = (result, should) => {
            let a = result.entries[0] - should.entries[0];
            let b = result.entries[1] - should.entries[1];
            return 1 / 2 * (a * a + b * b);
        };
        let should = new math_1.Vector([-1, 1]);
        let result01 = errorFunction(this.layer.forward(new math_1.Vector([2 + 10e-6, 3])), should);
        let result02 = errorFunction(this.layer.forward(new math_1.Vector([2 - 10e-6, 3])), should);
        let derivative1 = (result01 - result02) / (2 * 10e-6);
        let result11 = errorFunction(this.layer.forward(new math_1.Vector([2, 3 + 10e-6])), should);
        let result12 = errorFunction(this.layer.forward(new math_1.Vector([2, 3 - 10e-6])), should);
        let derivative2 = (result11 - result12) / (2 * 10e-6);
        result = this.layer.forward(new math_1.Vector([2, 3]));
        let errorDerivative = new math_1.Vector([result.entries[0] - should.entries[0], result.entries[1] - should.entries[1]]);
        let inputDerivative = this.layer.backward(errorDerivative, 0.01, false);
        chai_1.expect(Math.abs(inputDerivative.entries[0] - derivative1) < 10e-6).to.be.true;
        chai_1.expect(Math.abs(inputDerivative.entries[1] - derivative2) < 10e-6).to.be.true;
    }
};
__decorate([
    mocha_typescript_1.test
], LayerTest.prototype, "testForward", null);
__decorate([
    mocha_typescript_1.test
], LayerTest.prototype, "testBackward", null);
__decorate([
    mocha_typescript_1.test
], LayerTest.prototype, "testBackwardGradientChecking", null);
LayerTest = __decorate([
    mocha_typescript_1.suite
], LayerTest);
//# sourceMappingURL=layer.js.map