"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = void 0;
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const execute = (transaction, latestBlockhash) => __awaiter(void 0, void 0, void 0, function* () {
    const solanaConnection = new web3_js_1.Connection(constants_1.RPC_ENDPOINT, {
        wsEndpoint: constants_1.RPC_WEBSOCKET_ENDPOINT,
    });
    const signature = yield solanaConnection.sendRawTransaction(transaction.serialize(), {
        preflightCommitment: constants_1.COMMITMENT_LEVEL,
    });
    utils_1.logger.debug({ signature }, 'Confirming transaction...');
    const confirmation = yield solanaConnection.confirmTransaction({
        signature,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        blockhash: latestBlockhash.blockhash,
    }, constants_1.COMMITMENT_LEVEL);
    if (confirmation.value.err) {
        console.log("Confrimtaion error");
        return;
    }
    else {
        console.log("https://solscan.io/tx/", signature);
    }
});
exports.execute = execute;
