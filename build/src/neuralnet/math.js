"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Vector {
    constructor(entries) {
        this.entries = entries;
        this.length = entries.length;
    }
    isEntryNaN() {
        for (let i = 0; i < this.entries.length; i++) {
            if (Number.isNaN(this.entries[i])) {
                return true;
            }
        }
        return false;
    }
    multiply(other) {
        let sum = 0.0;
        for (let i = 0; i < this.entries.length; i++) {
            sum += this.entries[i] * other.entries[i];
        }
        return sum;
    }
    add(other) {
        for (let i = 0; i < this.length; i++) {
            this.entries[i] += other.entries[i];
        }
        return this;
    }
    scale(factor) {
        for (let i = 0; i < this.length; i++) {
            this.entries[i] *= factor;
        }
        return this;
    }
    getWithNewElement(element) {
        let newArr = this.entries.slice(0);
        newArr.push(element);
        return new Vector(newArr);
    }
    getWithoutLastElement() {
        let newArr = this.entries.slice(0);
        newArr.pop();
        return new Vector(newArr);
    }
    getScaled(factor) {
        let scaledEntries = new Array(this.length);
        for (let i = 0; i < this.length; i++) {
            scaledEntries[i] = this.entries[i] * factor;
        }
        return new Vector(scaledEntries);
    }
    toString() {
        let str = "(";
        for (let i = 0; i < this.entries.length; i++) {
            if (i == 0) {
                str += this.entries[i];
            }
            else {
                str += ", " + this.entries[i];
            }
        }
        str += ")";
        return str;
    }
}
exports.Vector = Vector;
function plus(a, b) {
    let entries = [];
    for (let i = 0; i < a.length; i++) {
        entries[i] = a.entries[i] + b.entries[i];
    }
    return new Vector(entries);
}
exports.plus = plus;
//# sourceMappingURL=math.js.map