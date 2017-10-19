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
class ReLu {
    constructor(epsilon) {
        this.epsilon = epsilon;
    }
    getName() {
        return "relu";
    }
    apply(input) {
        if (input > 0) {
            return input;
        }
        else {
            return this.epsilon * input;
        }
    }
    applyDerivative(input) {
        if (input > 0) {
            return 1;
        }
        else {
            return this.epsilon;
        }
    }
}
exports.ReLu = ReLu;
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