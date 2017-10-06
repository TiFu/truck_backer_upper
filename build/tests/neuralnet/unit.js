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
const unit_1 = require("../../src/neuralnet/unit");
const math_1 = require("../../src/neuralnet/math");
const activation_1 = require("../../src/neuralnet/activation");
let UnitTest = class UnitTest {
    before() {
        this.unitLinear = new unit_1.AdalineUnit(2, new activation_1.Linear());
        this.unitLinear.setWeights(new math_1.Vector([3, 7, 2]));
        this.unitTanh = new unit_1.AdalineUnit(2, new activation_1.Tanh());
        this.unitTanh.setWeights(new math_1.Vector([3, 7, 2]));
    }
    testForwardLinear() {
        let result = this.unitLinear.forward(new math_1.Vector([8, 5]));
        chai_1.expect(result).to.equal(61);
    }
    testForwardTanh() {
        let result = this.unitTanh.forward(new math_1.Vector([0.1, 0.01]));
        chai_1.expect(result).to.equal(Math.tanh(2.37));
    }
    testBackward() {
        let forward = this.unitTanh.forward(new math_1.Vector([0.1, 0.01]));
        chai_1.expect(forward).to.equal(Math.tanh(2.37));
        let errorDerivative = forward - (-1);
        let inputDerivative = this.unitTanh.backward(errorDerivative, 0.01, false);
        let expectedDx = errorDerivative * (1 - Math.tanh(2.37) * Math.tanh(2.37));
        let e1 = -0.01 * expectedDx * 0.1;
        let e2 = -0.01 * expectedDx * 0.01;
        let e3 = -0.01 * expectedDx * 1;
        let lastUpdate = this.unitTanh.getLastUpdate();
        chai_1.expect(lastUpdate.entries[0], 'First Update Parameter').to.equal(e1);
        chai_1.expect(lastUpdate.entries[1], 'Second Update Parameter').to.equal(e2);
        chai_1.expect(lastUpdate.entries[2], 'Third update parameter').to.equal(e3);
        let weights = this.unitTanh.getWeights();
        chai_1.expect(weights[0], 'Weight update 1 is incorrect.').to.equal(3 + e1);
        chai_1.expect(weights[1], 'Weight update 2 is incorrect.').to.equal(7 + e2);
        chai_1.expect(weights[2], 'Weight update 3 is incorrect').to.equal(2 + e3);
        chai_1.expect(inputDerivative.length).to.equal(2);
        chai_1.expect(inputDerivative.entries[0]).to.equal(expectedDx * 3);
        chai_1.expect(inputDerivative.entries[1]).to.equal(expectedDx * 7);
    }
};
__decorate([
    mocha_typescript_1.test
], UnitTest.prototype, "testForwardLinear", null);
__decorate([
    mocha_typescript_1.test
], UnitTest.prototype, "testForwardTanh", null);
__decorate([
    mocha_typescript_1.test
], UnitTest.prototype, "testBackward", null);
UnitTest = __decorate([
    mocha_typescript_1.suite
], UnitTest);
//# sourceMappingURL=unit.js.map