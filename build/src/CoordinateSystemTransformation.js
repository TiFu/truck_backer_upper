"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const math_1 = require("./math");
class CoordinateSystemTransformation {
    constructor(scaleFactor, nullPoint) {
        this.scaleFactor = scaleFactor;
        this.nullPoint = nullPoint;
    }
    mapIntoNewCordSystem(p) {
        return math_1.plus(math_1.mapPoint(p, this.scaleFactor), this.nullPoint);
    }
    mapIntoOldCordSystem(p) {
        return math_1.minus(math_1.mapPoint(p, 1 / this.scaleFactor), this.nullPoint);
    }
}
exports.CoordinateSystemTransformation = CoordinateSystemTransformation;
//# sourceMappingURL=CoordinateSystemTransformation.js.map