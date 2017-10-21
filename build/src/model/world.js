"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const math_1 = require("../math");
const truck_1 = require("./truck");
class Dock {
    constructor(position) {
        this.position = position;
        this.dockDirection = new math_1.Vector(0, 1);
    }
}
exports.Dock = Dock;
class World {
    constructor() {
        this.limits = [];
        this.boundaryChecksEnabled = true;
        this.resetWorld();
        this.limits = [
            new math_1.StraightLine(new math_1.Point(0, 0), new math_1.Vector(0, 1)),
            new math_1.StraightLine(new math_1.Point(0, 25), new math_1.Vector(1, 0)),
            new math_1.StraightLine(new math_1.Point(70, 25), new math_1.Vector(0, -1)),
            new math_1.StraightLine(new math_1.Point(70, -25), new math_1.Vector(-1, 0)),
        ];
    }
    getLimits() {
        return this.limits;
    }
    isTruckNotAtDock() {
        let truckCorners = this.truck.getTruckCorners();
        let trailerCorners = this.truck.getTrailerCorners();
        let a = this.dock.position;
        let b = math_1.plus(a, this.dock.dockDirection);
        let truckLeftOf = truckCorners.some((p) => math_1.isLeftOf(a, b, p));
        let trailerLeftOf = trailerCorners.some((p) => math_1.isLeftOf(a, b, p));
        return !(truckLeftOf || trailerLeftOf);
    }
    isTruckInArea() {
        let truckCorners = this.truck.getTruckCorners();
        let trailerCorners = this.truck.getTrailerCorners();
        let match = false;
        for (let i = 0; i < this.limits.length; i++) {
            let limit = truckCorners.some((p) => this.limits[i].isLeftOf(p) || trailerCorners.some((p) => this.limits[i].isLeftOf(p)));
            match = match || limit;
        }
        return !match;
    }
    isTruckInValidPosition() {
        return this.isTruckNotAtDock() && this.isTruckInArea();
    }
    resetWorld() {
        this.dock = new Dock(new math_1.Point(0, 0));
        this.truck = new truck_1.Truck(new math_1.Point(55, 0), 0, 0);
    }
    radToDeg(arr) {
        return [arr[0] * 180 / Math.PI, arr[1] * 180 / Math.PI];
    }
    randomizeMax(tep1, tep2, maxTrailerAngle, maxCabinAngle) {
        if (tep1 == undefined) {
            tep1 = new math_1.Point(7, 18);
        }
        if (tep2 == undefined) {
            tep2 = new math_1.Point(63, -18);
        }
        tep1.x = Math.min(Math.max(7, tep1.x), 63);
        tep1.y = Math.max(Math.min(18, tep1.y), -18);
        tep2.x = Math.min(Math.max(tep2.x, tep1.x), 63);
        tep2.y = Math.max(Math.min(tep2.y, tep1.y), -18);
        this.truck.setTruckIntoRandomPosition([tep1, tep2], maxTrailerAngle, maxCabinAngle);
        while (!this.isTruckInValidPosition()) {
            this.truck.setTruckIntoRandomPosition([tep1, tep2], maxTrailerAngle, maxCabinAngle);
        }
    }
    randomize() {
        let tep = new math_1.Point(12, 13);
        let tep2 = new math_1.Point(58, -13);
        this.truck.setTruckIntoRandomPosition([tep, tep2], [-Math.PI, Math.PI], [-0.5 * Math.PI, 0.5 * Math.PI]);
        while (!this.isTruckInValidPosition()) {
            this.truck.setTruckIntoRandomPosition([tep, tep2], [-Math.PI, Math.PI], [-0.5 * Math.PI, 0.5 * Math.PI]);
        }
    }
    nextTimeStep(steeringSignal) {
        if (!this.boundaryChecksEnabled || this.isTruckInValidPosition()) {
            this.truck.nextTimeStep(steeringSignal);
            return this.isTruckInValidPosition();
        }
        else {
            return false;
        }
    }
}
exports.World = World;
//# sourceMappingURL=world.js.map