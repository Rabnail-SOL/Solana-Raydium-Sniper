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
exports.clearMonitor = exports.monitor = void 0;
let monitorTimer;
const monitor = (poolId) => __awaiter(void 0, void 0, void 0, function* () {
    monitorTimer = setInterval(() => {
        (() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const res = yield fetch(`https://api.dexscreener.com/latest/dex/pairs/solana/${poolId === null || poolId === void 0 ? void 0 : poolId.toBase58()}`, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                const data = yield res.clone().json();
                if (data.pair)
                    console.log(`Token price : ${data.pair.priceNative}SOL / ${data.pair.priceUsd}USD  <<<=====>>> Liquidity: ${data.pair.liquidity.usd}USD / ${data.pair.liquidity.quote}SOL`);
            }
            catch (e) {
                // console.log("error in fetching price of pool", e)
            }
        }))();
    }, 2000);
});
exports.monitor = monitor;
const clearMonitor = () => {
    clearInterval(monitorTimer);
};
exports.clearMonitor = clearMonitor;
