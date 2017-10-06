"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    getVectorTo(b) {
        return new Vector(b.x - this.x, b.y - this.y);
    }
    addVector(b) {
        return new Point(this.x + b.x, this.y + b.y);
    }
    toString() {
        return "(" + this.x + "," + this.y + ")";
    }
}
exports.Point = Point;
class StraightLine {
    constructor(base, direction) {
        this.base = base;
        this.direction = direction;
    }
    isLeftOf(b) {
        return isLeftOf(this.base, plus(this.base, this.direction), b);
    }
}
exports.StraightLine = StraightLine;
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    getLength() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    scale(factor) {
        this.x = this.x * factor;
        this.y = this.y * factor;
        return this;
    }
    getOrthogonalVector() {
        return new Vector(this.y, -this.x);
    }
}
exports.Vector = Vector;
function isLeftOf(a, b, testPoint) {
    let d = (testPoint.x - a.x) * (b.y - a.y) - (testPoint.y - a.y) * (b.x - a.x);
    return d <= 0;
}
exports.isLeftOf = isLeftOf;
function rotate(b, degree) {
    let x = Math.cos(degree) * b.x - b.y * Math.sin(degree);
    let y = Math.sin(degree) * b.x + b.y * Math.cos(degree);
    return new Vector(x, y);
}
exports.rotate = rotate;
function plus(a, b) {
    return new Point(a.x + b.x, a.y + b.y);
}
exports.plus = plus;
function minus(a, b) {
    return new Point(a.x - b.x, a.y - b.y);
}
exports.minus = minus;
function mapPoint(a, scale) {
    return new Point(a.x * scale, a.y * -scale);
}
exports.mapPoint = mapPoint;
function scale(a, scale) {
    return new Vector(a.x * scale, a.y * scale);
}
exports.scale = scale;
function calculateVector(a, b) {
    return new Vector(b.x - a.x, b.y - a.y);
}
exports.calculateVector = calculateVector;
function scalarProduct(a, b) {
    return a.x * b.x + a.y * b.y;
}
exports.scalarProduct = scalarProduct;
function getAngle(a, b) {
    return Math.acos(scalarProduct(a, b) / (a.getLength() * b.getLength()));
}
exports.getAngle = getAngle;
function rotateVector(a, angle) {
    let newX = a.x * Math.cos(angle) - a.y * Math.sin(angle);
    let newY = a.x * Math.sin(angle) + a.y * Math.cos(angle);
    return new Vector(newX, newY);
}
exports.rotateVector = rotateVector;
//# sourceMappingURL=math.js.map