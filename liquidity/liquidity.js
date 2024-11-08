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
exports.getTokenAccounts = exports.createPoolKeys = exports.MINIMAL_MARKET_STATE_LAYOUT_V3 = exports.OPENBOOK_PROGRAM_ID = exports.RAYDIUM_LIQUIDITY_PROGRAM_ID_V4 = void 0;
const web3_js_1 = require("@solana/web3.js");
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const spl_token_1 = require("@solana/spl-token");
exports.RAYDIUM_LIQUIDITY_PROGRAM_ID_V4 = raydium_sdk_1.MAINNET_PROGRAM_ID.AmmV4;
exports.OPENBOOK_PROGRAM_ID = raydium_sdk_1.MAINNET_PROGRAM_ID.OPENBOOK_MARKET;
exports.MINIMAL_MARKET_STATE_LAYOUT_V3 = (0, raydium_sdk_1.struct)([
    (0, raydium_sdk_1.publicKey)('eventQueue'),
    (0, raydium_sdk_1.publicKey)('bids'),
    (0, raydium_sdk_1.publicKey)('asks'),
]);
function createPoolKeys(id, accountData, minimalMarketLayoutV3) {
    return {
        id,
        baseMint: accountData.baseMint,
        quoteMint: accountData.quoteMint,
        lpMint: accountData.lpMint,
        baseDecimals: accountData.baseDecimal.toNumber(),
        quoteDecimals: accountData.quoteDecimal.toNumber(),
        lpDecimals: 5,
        version: 4,
        programId: exports.RAYDIUM_LIQUIDITY_PROGRAM_ID_V4,
        authority: raydium_sdk_1.Liquidity.getAssociatedAuthority({
            programId: exports.RAYDIUM_LIQUIDITY_PROGRAM_ID_V4,
        }).publicKey,
        openOrders: accountData.openOrders,
        targetOrders: accountData.targetOrders,
        baseVault: accountData.baseVault,
        quoteVault: accountData.quoteVault,
        marketVersion: 3,
        marketProgramId: accountData.marketProgramId,
        marketId: accountData.marketId,
        marketAuthority: raydium_sdk_1.Market.getAssociatedAuthority({
            programId: accountData.marketProgramId,
            marketId: accountData.marketId,
        }).publicKey,
        marketBaseVault: accountData.baseVault,
        marketQuoteVault: accountData.quoteVault,
        marketBids: minimalMarketLayoutV3.bids,
        marketAsks: minimalMarketLayoutV3.asks,
        marketEventQueue: minimalMarketLayoutV3.eventQueue,
        withdrawQueue: accountData.withdrawQueue,
        lpVault: accountData.lpVault,
        lookupTableAccount: web3_js_1.PublicKey.default,
    };
}
exports.createPoolKeys = createPoolKeys;
function getTokenAccounts(connection, owner, commitment) {
    return __awaiter(this, void 0, void 0, function* () {
        const tokenResp = yield connection.getTokenAccountsByOwner(owner, {
            programId: spl_token_1.TOKEN_PROGRAM_ID,
        }, commitment);
        const accounts = [];
        for (const { pubkey, account } of tokenResp.value) {
            accounts.push({
                pubkey,
                programId: account.owner,
                accountInfo: raydium_sdk_1.SPL_ACCOUNT_LAYOUT.decode(account.data),
            });
        }
        return accounts;
    });
}
exports.getTokenAccounts = getTokenAccounts;
