"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrieveEnvVariable = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const retrieveEnvVariable = (variableName, logger) => {
    const variable = process.env[variableName] || '';
    if (!variable) {
        console.log(`${variableName} is not set`);
        process.exit(1);
    }
    return variable;
};
exports.retrieveEnvVariable = retrieveEnvVariable;
