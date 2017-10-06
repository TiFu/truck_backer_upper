"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const math_1 = require("../math");
const nnMath = require("../neuralnet/math");
class Truck {
    constructor(tep, trailerAngle, cabinAngle) {
        this.tep = tep;
        this.trailerAngle = trailerAngle;
        this.cabinAngle = cabinAngle;
        this.velocity = 1;
        this.maxSteeringAngle = Math.PI / 180 * 70;
        this.trailerLength = 7;
        this.cabinLength = 5;
        this.lastSteeringAngle = 0;
    }
    getStateVector() {
        let cdp = this.getCouplingDevicePosition();
        return new nnMath.Vector([cdp.x, cdp.y, this.fixAngle(this.cabinAngle), this.tep.x, this.tep.y, this.fixAngle(this.trailerAngle)]);
    }
    fixAngle(angle) {
        angle = angle % (2 * Math.PI);
        if (angle > Math.PI) {
            angle = Math.PI - (angle - Math.PI);
        }
        if (angle < -Math.PI) {
            angle = Math.PI - (angle + Math.PI);
        }
        return angle;
    }
    getTruckLength() {
        return this.cabinLength;
    }
    getLastSteeringAngle() {
        return this.lastSteeringAngle;
    }
    setTruckIntoRandomPosition(maxTep, maxTrailerAngle) {
        let tepAngle = Math.random() * (maxTrailerAngle[1] - maxTrailerAngle[0]) + maxTrailerAngle[0];
        this.trailerAngle = tepAngle;
        this.tep.x = Math.random() * (maxTep[1].x - maxTep[0].x) + maxTep[0].x;
        this.tep.y = Math.random() * (maxTep[1].y - maxTep[0].y) + maxTep[0].y;
        let cabAng = Math.random() * Math.PI - 0.5 * Math.PI;
        let cabinAngle = tepAngle + cabAng;
        this.cabinAngle = cabinAngle;
    }
    getTrailerLength() {
        return this.trailerLength;
    }
    getTrailerAngle() {
        return this.trailerAngle;
    }
    getTruckAngle() {
        return this.cabinAngle;
    }
    getTruckCorners() {
        let cabinDirection = math_1.rotate(new math_1.Vector(1, 0), this.cabinAngle);
        let orthogonal = cabinDirection.getOrthogonalVector();
        let scaled = orthogonal.scale(this.getWidth() / 2);
        let cdp = this.getCouplingDevicePosition();
        let cep = this.getEndOfTruck();
        let first = math_1.plus(cep, scaled);
        let second = math_1.minus(cep, scaled);
        let cfp = this.getCabinFrontPosition();
        let third = math_1.minus(cfp, scaled);
        let fourth = math_1.plus(cfp, scaled);
        return [first, second, third, fourth];
    }
    getTrailerCorners() {
        let trailerDirection = math_1.rotate(new math_1.Vector(1, 0), this.trailerAngle);
        let orthogonal = trailerDirection.getOrthogonalVector();
        let scaled = orthogonal.scale(this.getWidth() / 2);
        let first = math_1.plus(this.tep, scaled);
        let second = math_1.minus(this.tep, scaled);
        let cdp = this.getCouplingDevicePosition();
        let third = math_1.minus(cdp, scaled);
        let fourth = math_1.plus(cdp, scaled);
        return [first, second, third, fourth];
    }
    getWidth() {
        return 0.5 * this.cabinLength;
    }
    getTrailerEndPosition() {
        return this.tep;
    }
    getCouplingDevicePosition() {
        let truckDirection = math_1.rotate(new math_1.Vector(1, 0), this.trailerAngle).scale(this.trailerLength);
        let cdp = math_1.plus(this.tep, truckDirection);
        return cdp;
    }
    getCabinFrontPosition() {
        let cdp = this.getCouplingDevicePosition();
        let cabinDirection = math_1.rotate(new math_1.Vector(1, 0), this.cabinAngle).scale(this.cabinLength);
        return math_1.plus(cdp, cabinDirection);
    }
    getEndOfTruck() {
        let cabinDirection = math_1.rotate(new math_1.Vector(1, 0), this.cabinAngle);
        return math_1.plus(this.getCouplingDevicePosition(), cabinDirection.scale(2 / cabinDirection.getLength()));
    }
    getCabTrailerAngle() {
        return Math.abs(this.trailerAngle - this.cabinAngle);
    }
    nextTimeStep(steeringSignal) {
        this.drive(steeringSignal);
    }
    drive(steeringSignal) {
        let steeringAngle = this.maxSteeringAngle * Math.min(Math.max(-1, steeringSignal), 1);
        this.lastSteeringAngle = steeringAngle;
        let A = this.velocity * Math.cos(steeringAngle);
        let B = A * Math.cos(this.cabinAngle - this.trailerAngle);
        this.tep.x -= B * Math.cos(this.trailerAngle);
        this.tep.y -= B * Math.sin(this.trailerAngle);
        this.trailerAngle -= Math.asin(A * Math.sin(this.cabinAngle - this.trailerAngle) / this.trailerLength);
        this.cabinAngle += Math.asin(this.velocity * Math.sin(steeringAngle) / (this.trailerLength + this.cabinLength));
        let diff = this.trailerAngle - this.cabinAngle;
        if (diff < -Math.PI / 2) {
            this.cabinAngle = this.trailerAngle + Math.PI / 2;
            this.lastSteeringAngle = 0;
        }
        else if (diff > Math.PI / 2) {
            this.cabinAngle = this.trailerAngle - Math.PI / 2;
            this.lastSteeringAngle = 0;
        }
    }
}
exports.Truck = Truck;
class TruckException extends Error {
    constructor(message) {
        super(message);
    }
}
exports.TruckException = TruckException;
//# sourceMappingURL=truck.js.map