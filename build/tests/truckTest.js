"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const truck_1 = require("../src/model/truck");
const math_1 = require("../src/math");
const chai_1 = require("chai");
const mocha_typescript_1 = require("mocha-typescript");
let TruckTest = class TruckTest {
    before() {
        this.truck = new truck_1.Truck(new math_1.Point(5, 5), 0, 0);
    }
    driveStraight() {
        this.truck.nextTimeStep(0);
        chai_1.expect(this.truck.getCouplingDevicePosition()).to.deep.equal(new math_1.Point(5, 3));
        chai_1.expect(this.truck.getTrailerEndPosition()).to.deep.equal(new math_1.Point(5, 0));
        chai_1.expect(this.truck.getCabTrailerAngle()).to.equal(Math.PI / 2);
        chai_1.expect(this.truck.getTruckAngle()).to.equal(Math.PI / 2);
    }
    lengths() {
        chai_1.expect(this.truck.getTrailerLength()).to.equal(3);
        chai_1.expect(this.truck.getTruckLength()).to.equal(1);
    }
    driveLeft() {
        for (let i = 0; i < 10; i++) {
            try {
                this.truck.nextTimeStep(1);
            }
            catch (e) {
                if (e instanceof truck_1.TruckException) {
                    break;
                }
            }
        }
        chai_1.expect(this.truck.getCouplingDevicePosition()).to.deep.equal(new math_1.Point(7.162421935274231, 1.6093177159004508));
        chai_1.expect(this.truck.getTrailerEndPosition()).to.deep.equal(new math_1.Point(4.937097615808898, -0.40262951829734295));
        chai_1.expect(Math.abs(this.truck.getTrailerAngle() - 0.7350834755962865) < 10e-9).to.be.true;
        chai_1.expect(Math.abs(this.truck.getTruckAngle() - 2.305879802391183) < 10e-9).to.be.true;
    }
};
__decorate([
    mocha_typescript_1.test
], TruckTest.prototype, "driveStraight", null);
__decorate([
    mocha_typescript_1.test
], TruckTest.prototype, "lengths", null);
__decorate([
    mocha_typescript_1.test
], TruckTest.prototype, "driveLeft", null);
TruckTest = __decorate([
    mocha_typescript_1.suite
], TruckTest);
//# sourceMappingURL=truckTest.js.map