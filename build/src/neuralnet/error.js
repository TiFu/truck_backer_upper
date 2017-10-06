"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const math_1 = require("./math");
class MSE {
    getError(is, should) {
        let diff = 0;
        for (let i = 0; i < is.length; i++) {
            let d = is.entries[i] - should.entries[i];
            diff += d * d;
        }
        return 0.5 * diff;
    }
    getErrorDerivative(is, should) {
        return math_1.plus(is, should.getScaled(-1));
    }
}
exports.MSE = MSE;
//# sourceMappingURL=error.js.map