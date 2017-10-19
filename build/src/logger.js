"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let winston = require('winston');
function createLogger(name) {
    return winston.createLogger({
        transports: [
            new (winston.transports.Console)({
                colorize: true,
                prettyPrint: true,
                timestamp: true,
                label: 'CustomLabel'
            })
        ]
    });
}
exports.createLogger = createLogger;
//# sourceMappingURL=logger.js.map