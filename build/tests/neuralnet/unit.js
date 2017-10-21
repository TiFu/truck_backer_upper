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
        this.unitLinear = new unit_1.AdalineUnit(2, new activation_1.Linear(), 0.6);
        this.unitLinear.setWeights(new math_1.Vector([3, 7, 2]));
        this.unitTanh = new unit_1.AdalineUnit(2, new activation_1.Tanh(), 0.6);
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
    testBackwardGradientChecking() {
        let vec = new math_1.Vector([0.1, 0.01]);
        let forward = this.unitTanh.forward(vec);
        console.log(this.unitTanh.getWeights());
        chai_1.expect(forward).to.equal(Math.tanh(2.37));
        let firstGradient = this.gradientCheckInputs(vec, 0, this.unitTanh);
        let secondGradient = this.gradientCheckInputs(vec, 1, this.unitTanh);
        let firstWeight = this.gradientCheckWeights(vec, 0, this.unitTanh);
        let secondWeight = this.gradientCheckWeights(vec, 1, this.unitTanh);
        let thirdWeight = this.gradientCheckWeights(vec, 2, this.unitTanh);
        const learningRate = 0.01;
        const inputDerivative = this.unitTanh.backward(1, learningRate, false);
        chai_1.expect(Math.abs(firstGradient - inputDerivative.entries[0]) < 10e-4).to.be.true;
        chai_1.expect(Math.abs(secondGradient - inputDerivative.entries[1]) < 10e-4).to.be.true;
        let update = this.unitTanh.getLastUpdate();
        chai_1.expect(Math.abs(firstWeight + 1 / learningRate * update.entries[0]) < 10e-4, "First Weight incorrect").to.be.true;
        chai_1.expect(Math.abs(secondWeight + 1 / learningRate * update.entries[1]) < 10e-4, "First Weight incorrect").to.be.true;
        chai_1.expect(Math.abs(thirdWeight + 1 / learningRate * update.entries[2]) < 10e-4, "First Weight incorrect").to.be.true;
    }
    gradientCheckWeights(vec, entry, unit) {
        let newWeights = unit.getWeights();
        console.log(newWeights);
        console.log(vec);
        newWeights[entry] += 10e-6;
        let a = unit.forward(vec);
        newWeights[entry] -= 2 * 10e-6;
        let b = unit.forward(vec);
        newWeights[entry] += 10e-6;
        return (a - b) / (2 * 10e-6);
    }
    gradientCheckInputs(vec, entry, unit) {
        let b = new math_1.Vector(vec.entries.slice());
        b.entries[entry] += 10e-6;
        let c = new math_1.Vector(vec.entries.slice());
        c.entries[entry] -= 10e-6;
        return (unit.forward(b) - unit.forward(c)) / (2 * 10e-6);
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
__decorate([
    mocha_typescript_1.test
], UnitTest.prototype, "testBackwardGradientChecking", null);
UnitTest = __decorate([
    mocha_typescript_1.suite
], UnitTest);
//# sourceMappingURL=unit.js.map