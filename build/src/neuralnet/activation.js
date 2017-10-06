"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Tanh {
    getName() {
        return "tanh";
    }
    apply(input) {
        return Math.tanh(input);
    }
    applyDerivative(input) {
        return 1 - this.apply(input) * this.apply(input);
    }
}
exports.Tanh = Tanh;
class Sigmoid {
    getName() {
        return "sigmoid";
    }
    apply(input) {
        return 1 / (1 + Math.exp(-input));
    }
    applyDerivative(input) {
        return this.apply(input) * (1 - this.apply(input));
    }
}
exports.Sigmoid = Sigmoid;
class Linear {
    getName() {
        return "linear";
    }
    apply(input) {
        return input;
    }
    applyDerivative(input) {
        return 1;
    }
}
exports.Linear = Linear;
//# sourceMappingURL=activation.js.map