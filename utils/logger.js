"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConsoleLines = exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const readline_1 = require("readline");
const transport = pino_1.default.transport({
    target: 'pino-pretty',
});
exports.logger = (0, pino_1.default)({
    level: 'info',
    redact: ['poolKeys'],
    serializers: {
        error: pino_1.default.stdSerializers.err,
    },
    base: undefined,
}, transport);
function deleteConsoleLines(numLines) {
    for (let i = 0; i < numLines; i++) {
        process.stdout.moveCursor(0, -1); // Move cursor up one line
        (0, readline_1.clearLine)(process.stdout, 0); // Clear the line
    }
}
exports.deleteConsoleLines = deleteConsoleLines;
