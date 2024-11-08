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
exports.getMinimalMarketV3 = void 0;
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const liquidity_1 = require("../liquidity");
function getMinimalMarketV3(connection, marketId, commitment) {
    return __awaiter(this, void 0, void 0, function* () {
        const marketInfo = yield connection.getAccountInfo(marketId, {
            commitment,
            dataSlice: {
                offset: raydium_sdk_1.MARKET_STATE_LAYOUT_V3.offsetOf('eventQueue'),
                length: 32 * 3,
            },
        });
        return liquidity_1.MINIMAL_MARKET_STATE_LAYOUT_V3.decode(marketInfo.data);
    });
}
exports.getMinimalMarketV3 = getMinimalMarketV3;
