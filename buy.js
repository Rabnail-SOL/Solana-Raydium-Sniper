"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sell = exports.processOpenBookMarket = exports.checkMintable = exports.processRaydiumPool = void 0;
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const liquidity_1 = require("./liquidity");
const utils_1 = require("./utils");
const market_1 = require("./market");
const types_1 = require("./types");
const bs58_1 = __importDefault(require("bs58"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readline_1 = __importDefault(require("readline"));
const constants_1 = require("./constants");
const bn_js_1 = require("bn.js");
const tokenFilter_1 = require("./tokenFilter");
const jito_1 = require("./executor/jito");
const legacy_1 = require("./executor/legacy");
const jitoWithAxios_1 = require("./executor/jitoWithAxios");
const solanaConnection = new web3_js_1.Connection(constants_1.RPC_ENDPOINT, {
    wsEndpoint: constants_1.RPC_WEBSOCKET_ENDPOINT,
});
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
const existingLiquidityPools = new Set();
const existingOpenBookMarkets = new Set();
const existingTokenAccounts = new Map();
let wallet;
let quoteToken;
let quoteTokenAssociatedAddress;
let quoteAmount;
let quoteMinPoolSizeAmount;
let quoteMaxPoolSizeAmount;
let processingToken = false;
let poolId;
let tokenAccountInCommon;
let accountDataInCommon;
let idDealt = spl_token_1.NATIVE_MINT.toBase58();
let snipeList = [];
let timesChecked = 0;
let soldSome = false;
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        utils_1.logger.level = constants_1.LOG_LEVEL;
        // get wallet
        wallet = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(constants_1.PRIVATE_KEY));
        const solBalance = yield solanaConnection.getBalance(wallet.publicKey);
        console.log(`Wallet Address: ${wallet.publicKey}`);
        console.log(`SOL balance: ${(solBalance / 10 ** 9).toFixed(3)}SOL`);
        // get quote mint and amount
        switch (constants_1.QUOTE_MINT) {
            case 'WSOL': {
                quoteToken = raydium_sdk_1.Token.WSOL;
                quoteAmount = new raydium_sdk_1.TokenAmount(raydium_sdk_1.Token.WSOL, constants_1.QUOTE_AMOUNT, false);
                quoteMinPoolSizeAmount = new raydium_sdk_1.TokenAmount(quoteToken, constants_1.MIN_POOL_SIZE, false);
                quoteMaxPoolSizeAmount = new raydium_sdk_1.TokenAmount(quoteToken, constants_1.MAX_POOL_SIZE, false);
                break;
            }
            case 'USDC': {
                quoteToken = new raydium_sdk_1.Token(spl_token_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), 6, 'USDC', 'USDC');
                quoteAmount = new raydium_sdk_1.TokenAmount(quoteToken, constants_1.QUOTE_AMOUNT, false);
                quoteMinPoolSizeAmount = new raydium_sdk_1.TokenAmount(quoteToken, constants_1.MIN_POOL_SIZE, false);
                quoteMaxPoolSizeAmount = new raydium_sdk_1.TokenAmount(quoteToken, constants_1.MAX_POOL_SIZE, false);
                break;
            }
            default: {
                throw new Error(`Unsupported quote mint "${constants_1.QUOTE_MINT}". Supported values are USDC and WSOL`);
            }
        }
        console.log(`Snipe list: ${constants_1.USE_SNIPE_LIST}`);
        console.log(`Check mint renounced: ${constants_1.CHECK_IF_MINT_IS_RENOUNCED}`);
        console.log(`Check token socials: ${constants_1.CHECK_SOCIAL}`);
        console.log(`Min pool size: ${quoteMinPoolSizeAmount.isZero() ? 'false' : quoteMinPoolSizeAmount.toFixed(2)} ${quoteToken.symbol}`);
        console.log(`Max pool size: ${quoteMaxPoolSizeAmount.isZero() ? 'false' : quoteMaxPoolSizeAmount.toFixed(2)} ${quoteToken.symbol}`);
        console.log(`One token at a time: ${constants_1.ONE_TOKEN_AT_A_TIME}`);
        console.log(`Buy amount: ${quoteAmount.toFixed()} ${quoteToken.symbol}`);
        // check existing wallet for associated token account of quote mint
        const tokenAccounts = yield (0, liquidity_1.getTokenAccounts)(solanaConnection, wallet.publicKey, constants_1.COMMITMENT_LEVEL);
        for (const ta of tokenAccounts) {
            existingTokenAccounts.set(ta.accountInfo.mint.toString(), {
                mint: ta.accountInfo.mint,
                address: ta.pubkey,
            });
        }
        quoteTokenAssociatedAddress = yield (0, spl_token_1.getAssociatedTokenAddress)(spl_token_1.NATIVE_MINT, wallet.publicKey);
        const wsolBalance = yield solanaConnection.getBalance(quoteTokenAssociatedAddress);
        console.log(`WSOL Balance: ${wsolBalance}`);
        if (!(!wsolBalance || wsolBalance == 0))
            // await unwrapSol(quoteTokenAssociatedAddress)
            // load tokens to snipe
            loadSnipeList();
    });
}
function saveTokenAccount(mint, accountData) {
    const ata = (0, spl_token_1.getAssociatedTokenAddressSync)(mint, wallet.publicKey);
    const tokenAccount = {
        address: ata,
        mint: mint,
        market: {
            bids: accountData.bids,
            asks: accountData.asks,
            eventQueue: accountData.eventQueue,
        },
    };
    existingTokenAccounts.set(mint.toString(), tokenAccount);
    return tokenAccount;
}
function processRaydiumPool(id, poolState) {
    return __awaiter(this, void 0, void 0, function* () {
        if (idDealt == id.toString())
            return;
        idDealt = id.toBase58();
        try {
            const quoteBalance = (yield solanaConnection.getBalance(poolState.quoteVault, "processed")) / 10 ** 9;
            if (!shouldBuy(poolState.baseMint.toString())) {
                return;
            }
            console.log(`Detected a new pool: https://dexscreener.com/solana/${id.toString()}`);
            if (!quoteMinPoolSizeAmount.isZero()) {
                console.log(`Processing pool: ${id.toString()} with ${quoteBalance.toFixed(2)} ${quoteToken.symbol} in liquidity`);
                // if (poolSize.lt(quoteMinPoolSizeAmount)) {
                if (parseFloat(constants_1.MIN_POOL_SIZE) > quoteBalance) {
                    console.log(`Skipping pool, smaller than ${constants_1.MIN_POOL_SIZE} ${quoteToken.symbol}`);
                    console.log(`-------------------------------------- \n`);
                    return;
                }
            }
            if (!quoteMaxPoolSizeAmount.isZero()) {
                const poolSize = new raydium_sdk_1.TokenAmount(quoteToken, poolState.swapQuoteInAmount, true);
                // if (poolSize.gt(quoteMaxPoolSizeAmount)) {
                if (parseFloat(constants_1.MAX_POOL_SIZE) < quoteBalance) {
                    console.log(`Skipping pool, larger than ${constants_1.MIN_POOL_SIZE} ${quoteToken.symbol}`);
                    console.log(`Skipping pool, bigger than ${quoteMaxPoolSizeAmount.toFixed()} ${quoteToken.symbol}`, `Swap quote in amount: ${poolSize.toFixed()}`);
                    console.log(`-------------------------------------- \n`);
                    return;
                }
            }
        }
        catch (error) {
            console.log(`Error in getting new pool balance, ${error}`);
        }
        if (constants_1.CHECK_IF_MINT_IS_RENOUNCED) {
            const mintOption = yield checkMintable(poolState.baseMint);
            if (mintOption !== true) {
                console.log('Skipping, owner can mint tokens!', poolState.baseMint);
                return;
            }
        }
        if (constants_1.CHECK_SOCIAL) {
            const isSocial = yield (0, tokenFilter_1.checkSocial)(solanaConnection, poolState.baseMint, constants_1.COMMITMENT_LEVEL);
            if (isSocial !== true) {
                console.log('Skipping, token does not have socials', poolState.baseMint);
                return;
            }
        }
        if (constants_1.CHECK_IF_MINT_IS_MUTABLE) {
            const mutable = yield (0, tokenFilter_1.checkMutable)(solanaConnection, poolState.baseMint);
            if (mutable == true) {
                console.log('Skipping, token is mutable!', poolState.baseMint);
                return;
            }
        }
        if (constants_1.CHECK_IF_MINT_IS_BURNED) {
            const burned = yield (0, tokenFilter_1.checkBurn)(solanaConnection, poolState.lpMint, constants_1.COMMITMENT_LEVEL);
            if (burned !== true) {
                console.log('Skipping, token is not burned!', poolState.baseMint);
                return;
            }
        }
        processingToken = true;
        yield buy(id, poolState);
    });
}
exports.processRaydiumPool = processRaydiumPool;
function checkMintable(vault) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let { data } = (yield solanaConnection.getAccountInfo(vault)) || {};
            if (!data) {
                return;
            }
            const deserialize = types_1.MintLayout.decode(data);
            return deserialize.mintAuthorityOption === 0;
        }
        catch (e) {
            utils_1.logger.debug(e);
            console.log(`Failed to check if mint is renounced`, vault);
        }
    });
}
exports.checkMintable = checkMintable;
function processOpenBookMarket(updatedAccountInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        let accountData;
        try {
            accountData = raydium_sdk_1.MARKET_STATE_LAYOUT_V3.decode(updatedAccountInfo.accountInfo.data);
            // to be competitive, we collect market data before buying the token...
            if (existingTokenAccounts.has(accountData.baseMint.toString())) {
                return;
            }
            saveTokenAccount(accountData.baseMint, accountData);
        }
        catch (e) {
            utils_1.logger.debug(e);
            console.log(`Failed to process market, mint: `, accountData === null || accountData === void 0 ? void 0 : accountData.baseMint);
        }
    });
}
exports.processOpenBookMarket = processOpenBookMarket;
function buy(accountId, accountData) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Buy action triggered`);
        try {
            let tokenAccount = existingTokenAccounts.get(accountData.baseMint.toString());
            tokenAccountInCommon = tokenAccount;
            accountDataInCommon = accountData;
            if (!tokenAccount) {
                // it's possible that we didn't have time to fetch open book data
                const market = yield (0, market_1.getMinimalMarketV3)(solanaConnection, accountData.marketId, constants_1.COMMITMENT_LEVEL);
                tokenAccount = saveTokenAccount(accountData.baseMint, market);
            }
            tokenAccount.poolKeys = (0, liquidity_1.createPoolKeys)(accountId, accountData, tokenAccount.market);
            const { innerTransaction } = raydium_sdk_1.Liquidity.makeSwapFixedInInstruction({
                poolKeys: tokenAccount.poolKeys,
                userKeys: {
                    tokenAccountIn: quoteTokenAssociatedAddress,
                    tokenAccountOut: tokenAccount.address,
                    owner: wallet.publicKey,
                },
                amountIn: quoteAmount.raw,
                minAmountOut: 0,
            }, tokenAccount.poolKeys.version);
            const latestBlockhash = yield solanaConnection.getLatestBlockhash({
                commitment: constants_1.COMMITMENT_LEVEL,
            });
            const instructions = [];
            if (!(yield solanaConnection.getAccountInfo(quoteTokenAssociatedAddress)))
                instructions.push((0, spl_token_1.createAssociatedTokenAccountInstruction)(wallet.publicKey, quoteTokenAssociatedAddress, wallet.publicKey, spl_token_1.NATIVE_MINT));
            instructions.push(web3_js_1.SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: quoteTokenAssociatedAddress,
                lamports: Math.ceil(parseFloat(constants_1.QUOTE_AMOUNT) * 10 ** 9),
            }), (0, spl_token_1.createSyncNativeInstruction)(quoteTokenAssociatedAddress, spl_token_1.TOKEN_PROGRAM_ID), (0, spl_token_1.createAssociatedTokenAccountIdempotentInstruction)(wallet.publicKey, tokenAccount.address, wallet.publicKey, accountData.baseMint), ...innerTransaction.instructions);
            const messageV0 = new web3_js_1.TransactionMessage({
                payerKey: wallet.publicKey,
                recentBlockhash: latestBlockhash.blockhash,
                instructions,
            }).compileToV0Message();
            const transaction = new web3_js_1.VersionedTransaction(messageV0);
            transaction.sign([wallet, ...innerTransaction.signers]);
            if (constants_1.JITO_MODE) {
                if (constants_1.JITO_ALL) {
                    yield (0, jitoWithAxios_1.jitoWithAxios)(transaction, wallet, latestBlockhash);
                }
                else {
                    const result = yield (0, jito_1.bundle)([transaction], wallet);
                }
            }
            else {
                yield (0, legacy_1.execute)(transaction, latestBlockhash);
            }
        }
        catch (e) {
            utils_1.logger.debug(e);
            console.log(`Failed to buy token, ${accountData.baseMint}`);
        }
    });
}
function sell(mint_1, amount_1) {
    return __awaiter(this, arguments, void 0, function* (mint, amount, isTp1Sell = false) {
        try {
            const tokenAccount = existingTokenAccounts.get(mint.toString());
            if (!tokenAccount) {
                console.log("Sell token account not exist");
                return;
            }
            if (!tokenAccount.poolKeys) {
                console.log('No pool keys found: ', mint);
                return;
            }
            if (amount == "0") {
                console.log(`Checking: Sold already`, tokenAccount.mint);
                return;
            }
            const { innerTransaction } = raydium_sdk_1.Liquidity.makeSwapFixedInInstruction({
                poolKeys: tokenAccount.poolKeys,
                userKeys: {
                    tokenAccountOut: quoteTokenAssociatedAddress,
                    tokenAccountIn: tokenAccount.address,
                    owner: wallet.publicKey,
                },
                amountIn: amount,
                minAmountOut: 0,
            }, tokenAccount.poolKeys.version);
            const tx = new web3_js_1.Transaction().add(...innerTransaction.instructions);
            tx.feePayer = wallet.publicKey;
            tx.recentBlockhash = (yield solanaConnection.getLatestBlockhash()).blockhash;
            const latestBlockhash = yield solanaConnection.getLatestBlockhash({
                commitment: constants_1.COMMITMENT_LEVEL,
            });
            const messageV0 = new web3_js_1.TransactionMessage({
                payerKey: wallet.publicKey,
                recentBlockhash: latestBlockhash.blockhash,
                instructions: [
                    ...innerTransaction.instructions,
                    (0, spl_token_1.createCloseAccountInstruction)(quoteTokenAssociatedAddress, wallet.publicKey, wallet.publicKey),
                ],
            }).compileToV0Message();
            const transaction = new web3_js_1.VersionedTransaction(messageV0);
            transaction.sign([wallet, ...innerTransaction.signers]);
            if (constants_1.JITO_MODE) {
                if (constants_1.JITO_ALL) {
                    yield (0, jitoWithAxios_1.jitoWithAxios)(transaction, wallet, latestBlockhash);
                }
                else {
                    yield (0, jito_1.bundle)([transaction], wallet);
                }
            }
            else {
                yield (0, legacy_1.execute)(transaction, latestBlockhash);
            }
        }
        catch (e) {
            yield sleep(1000);
            utils_1.logger.debug(e);
        }
        if (!isTp1Sell) {
            yield sell(mint, amount, true);
            processingToken = false;
        }
    });
}
exports.sell = sell;
function loadSnipeList() {
    if (!constants_1.USE_SNIPE_LIST) {
        return;
    }
    const count = snipeList.length;
    const data = fs.readFileSync(path.join(__dirname, 'snipe-list.txt'), 'utf-8');
    snipeList = data
        .split('\n')
        .map((a) => a.trim())
        .filter((a) => a);
    if (snipeList.length != count) {
        console.log(`Loaded snipe list: ${snipeList.length}`);
    }
}
function shouldBuy(key) {
    return constants_1.USE_SNIPE_LIST ? snipeList.includes(key) : constants_1.ONE_TOKEN_AT_A_TIME ? !processingToken : true;
}
const runListener = () => __awaiter(void 0, void 0, void 0, function* () {
    yield init();
    trackWallet(solanaConnection);
    const runTimestamp = Math.floor(new Date().getTime() / 1000);
    const raydiumSubscriptionId = solanaConnection.onProgramAccountChange(liquidity_1.RAYDIUM_LIQUIDITY_PROGRAM_ID_V4, (updatedAccountInfo) => __awaiter(void 0, void 0, void 0, function* () {
        const key = updatedAccountInfo.accountId.toString();
        const poolState = raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.decode(updatedAccountInfo.accountInfo.data);
        const poolOpenTime = parseInt(poolState.poolOpenTime.toString());
        const existing = existingLiquidityPools.has(key);
        if (poolOpenTime > runTimestamp && !existing) {
            existingLiquidityPools.add(key);
            const _ = processRaydiumPool(updatedAccountInfo.accountId, poolState);
            poolId = updatedAccountInfo.accountId;
        }
    }), constants_1.COMMITMENT_LEVEL, [
        { dataSize: raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.span },
        {
            memcmp: {
                offset: raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.offsetOf('quoteMint'),
                bytes: quoteToken.mint.toBase58(),
            },
        },
        {
            memcmp: {
                offset: raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.offsetOf('marketProgramId'),
                bytes: liquidity_1.OPENBOOK_PROGRAM_ID.toBase58(),
            },
        },
        {
            memcmp: {
                offset: raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.offsetOf('status'),
                bytes: bs58_1.default.encode([6, 0, 0, 0, 0, 0, 0, 0]),
            },
        },
    ]);
    const openBookSubscriptionId = solanaConnection.onProgramAccountChange(liquidity_1.OPENBOOK_PROGRAM_ID, (updatedAccountInfo) => __awaiter(void 0, void 0, void 0, function* () {
        const key = updatedAccountInfo.accountId.toString();
        const existing = existingOpenBookMarkets.has(key);
        if (!existing) {
            existingOpenBookMarkets.add(key);
            const _ = processOpenBookMarket(updatedAccountInfo);
        }
    }), constants_1.COMMITMENT_LEVEL, [
        { dataSize: raydium_sdk_1.MARKET_STATE_LAYOUT_V3.span },
        {
            memcmp: {
                offset: raydium_sdk_1.MARKET_STATE_LAYOUT_V3.offsetOf('quoteMint'),
                bytes: quoteToken.mint.toBase58(),
            },
        },
    ]);
    const walletSubscriptionId = solanaConnection.onProgramAccountChange(spl_token_1.TOKEN_PROGRAM_ID, (updatedAccountInfo) => __awaiter(void 0, void 0, void 0, function* () {
        yield walletChange(updatedAccountInfo);
    }), constants_1.COMMITMENT_LEVEL, [
        {
            dataSize: 165,
        },
        {
            memcmp: {
                offset: 32,
                bytes: wallet.publicKey.toBase58(),
            },
        },
    ]);
    console.log(`Listening for wallet changes: ${walletSubscriptionId}`);
    // }
    console.log(`Listening for raydium changes: ${raydiumSubscriptionId}`);
    console.log(`Listening for open book changes: ${openBookSubscriptionId}`);
    console.log('----------------------------------------');
    console.log('Bot is running! Press CTRL + C to stop it.');
    console.log('----------------------------------------');
    if (constants_1.USE_SNIPE_LIST) {
        setInterval(loadSnipeList, constants_1.SNIPE_LIST_REFRESH_INTERVAL);
    }
});
const unwrapSol = (wSolAccount) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const wsolAccountInfo = yield solanaConnection.getAccountInfo(wSolAccount);
        if (wsolAccountInfo) {
            const wsolBalanace = yield solanaConnection.getBalance(wSolAccount);
            console.log(`Trying to unwrap ${wsolBalanace / 10 ** 9}wsol to sol`);
            const instructions = [];
            instructions.push((0, spl_token_1.createCloseAccountInstruction)(wSolAccount, wallet.publicKey, wallet.publicKey));
            const latestBlockhash = yield solanaConnection.getLatestBlockhash({
                commitment: constants_1.COMMITMENT_LEVEL,
            });
            const messageV0 = new web3_js_1.TransactionMessage({
                payerKey: wallet.publicKey,
                recentBlockhash: latestBlockhash.blockhash,
                instructions: [...instructions],
            }).compileToV0Message();
            const transaction = new web3_js_1.VersionedTransaction(messageV0);
            transaction.sign([wallet]);
            if (constants_1.JITO_MODE) {
                if (constants_1.JITO_ALL) {
                    const result = yield (0, jitoWithAxios_1.jitoWithAxios)(transaction, wallet, latestBlockhash);
                }
                else {
                    const result = yield (0, jito_1.bundle)([transaction], wallet);
                }
            }
            else {
                yield (0, legacy_1.execute)(transaction, latestBlockhash);
            }
            yield sleep(5000);
            const wBal = yield solanaConnection.getBalance(wSolAccount);
            if (wBal > 0) {
                console.log("Unwrapping WSOL failed");
            }
            else {
                console.log("Successfully unwrapped WSOL to SOL");
            }
        }
    }
    catch (error) {
        console.log("Error unwrapping WSOL");
    }
});
const inputAction = (accountId, mint, amount) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("\n\n\n==========================================================\n\n\n");
    rl.question('If you want to sell, plz input "sell" and press enter: \n\n', (data) => __awaiter(void 0, void 0, void 0, function* () {
        const input = data.toString().trim();
        if (input === 'sell') {
            timesChecked = 1000000;
        }
        else {
            console.log('Received input invalid :\t', input);
            inputAction(accountId, mint, amount);
        }
    }));
});
const priceMatch = (amountIn, poolKeys) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (constants_1.PRICE_CHECK_DURATION === 0 || constants_1.PRICE_CHECK_INTERVAL === 0) {
            return;
        }
        let priceMatchAtOne = false;
        const timesToCheck = constants_1.PRICE_CHECK_DURATION / constants_1.PRICE_CHECK_INTERVAL;
        const temp = amountIn.raw.toString();
        const tokenAmount = new bn_js_1.BN(temp.substring(0, temp.length - 2));
        const sellAt1 = tokenAmount.mul(new bn_js_1.BN(constants_1.SELL_AT_TP1)).toString();
        const slippage = new raydium_sdk_1.Percent(constants_1.SELL_SLIPPAGE, 100);
        const tp1 = Number((Number(constants_1.QUOTE_AMOUNT) * (100 + constants_1.TAKE_PROFIT1) / 100).toFixed(4));
        const tp2 = Number((Number(constants_1.QUOTE_AMOUNT) * (100 + constants_1.TAKE_PROFIT2) / 100).toFixed(4));
        const sl = Number((Number(constants_1.QUOTE_AMOUNT) * (100 - constants_1.STOP_LOSS) / 100).toFixed(4));
        timesChecked = 0;
        do {
            try {
                const poolInfo = yield raydium_sdk_1.Liquidity.fetchInfo({
                    connection: solanaConnection,
                    poolKeys,
                });
                const { amountOut } = raydium_sdk_1.Liquidity.computeAmountOut({
                    poolKeys,
                    poolInfo,
                    amountIn,
                    currencyOut: quoteToken,
                    slippage,
                });
                const pnl = (Number(amountOut.toFixed(6)) - Number(constants_1.QUOTE_AMOUNT)) / Number(constants_1.QUOTE_AMOUNT) * 100;
                if (timesChecked > 0) {
                    (0, utils_1.deleteConsoleLines)(1);
                }
                const data = yield getPrice();
                if (data) {
                    const { priceUsd, liquidity, fdv, txns, marketCap, pairCreatedAt, volume_m5, volume_h1, volume_h6, priceChange_m5, priceChange_h1, priceChange_h6 } = data;
                    // console.log(`Take profit1: ${tp1} SOL | Take profit2: ${tp2} SOL  | Stop loss: ${sl} SOL | Buy amount: ${QUOTE_AMOUNT} SOL | Current: ${amountOut.toFixed(4)} SOL | PNL: ${pnl.toFixed(3)}%`)
                    console.log(`TP1: ${tp1} | TP2: ${tp2} | SL: ${sl} | Lq: $${(liquidity.usd / 1000).toFixed(3)}K | MC: $${(marketCap / 1000).toFixed(3)}K | Price: $${Number(priceUsd).toFixed(3)} | 5M: ${priceChange_m5}% | 1H: ${priceChange_h1}% | TXs: ${(txns.h1.buys + txns.h1.sells)} | Buy: ${txns.h1.buys} | Sell: ${txns.h1.sells} | Vol: $${(volume_h1 / 1000).toFixed(3)}K`);
                }
                const amountOutNum = Number(amountOut.toFixed(7));
                if (amountOutNum < sl) {
                    console.log("Token is on stop loss point, will sell with loss");
                    break;
                }
                // if (amountOutNum > tp1) {
                if (pnl > constants_1.TAKE_PROFIT1) {
                    if (!priceMatchAtOne) {
                        console.log("Token is on first level profit, will sell some and wait for second level higher profit");
                        priceMatchAtOne = true;
                        soldSome = true;
                        sell(poolKeys.baseMint, sellAt1, true);
                        // break
                    }
                }
                // if (amountOutNum < tp1 && priceMatchAtOne) {
                if (pnl < constants_1.TAKE_PROFIT1 && priceMatchAtOne) {
                    console.log("Token is on first level profit again, will sell with first level");
                    break;
                }
                // if (amountOutNum > tp2) {
                if (pnl > constants_1.TAKE_PROFIT2) {
                    console.log("Token is on second level profit, will sell with second level profit");
                    break;
                }
            }
            catch (e) {
            }
            finally {
                timesChecked++;
            }
            yield sleep(constants_1.PRICE_CHECK_INTERVAL);
        } while (timesChecked < timesToCheck);
    }
    catch (error) {
        console.log("Error when setting profit amounts", error);
    }
});
const sleep = (ms) => __awaiter(void 0, void 0, void 0, function* () {
    yield new Promise((resolve) => setTimeout(resolve, ms));
});
let bought = spl_token_1.NATIVE_MINT.toBase58();
const walletChange = (updatedAccountInfo) => __awaiter(void 0, void 0, void 0, function* () {
    const accountData = spl_token_1.AccountLayout.decode(updatedAccountInfo.accountInfo.data);
    if (updatedAccountInfo.accountId.equals(quoteTokenAssociatedAddress)) {
        return;
    }
    if (tokenAccountInCommon && accountDataInCommon) {
        if (bought != accountDataInCommon.baseMint.toBase58()) {
            console.log(`\n--------------- bought token successfully ---------------------- \n`);
            console.log(`https://dexscreener.com/solana/${accountDataInCommon.baseMint.toBase58()}`);
            console.log(`PHOTON: https://photon-sol.tinyastro.io/en/lp/${tokenAccountInCommon.poolKeys.id.toString()}`);
            console.log(`DEXSCREENER: https://dexscreener.com/solana/${tokenAccountInCommon.poolKeys.id.toString()}`);
            console.log(`JUPITER: https://jup.ag/swap/${accountDataInCommon.baseMint.toBase58()}-SOL`);
            console.log(`BIRDEYE: https://birdeye.so/token/${accountDataInCommon.baseMint.toBase58()}?chain=solana\n\n`);
            bought = accountDataInCommon.baseMint.toBase58();
            const tokenAccount = yield (0, spl_token_1.getAssociatedTokenAddress)(accountData.mint, wallet.publicKey);
            const tokenBalance = yield getTokenBalance(tokenAccount);
            if (tokenBalance == "0") {
                console.log(`Detected a new pool, but didn't confirm buy action`);
                return;
            }
            const tokenIn = new raydium_sdk_1.Token(spl_token_1.TOKEN_PROGRAM_ID, tokenAccountInCommon.poolKeys.baseMint, tokenAccountInCommon.poolKeys.baseDecimals);
            const tokenAmountIn = new raydium_sdk_1.TokenAmount(tokenIn, tokenBalance, true);
            inputAction(updatedAccountInfo.accountId, accountData.mint, tokenBalance);
            yield priceMatch(tokenAmountIn, tokenAccountInCommon.poolKeys);
            const tokenBalanceAfterCheck = yield getTokenBalance(tokenAccount);
            if (tokenBalanceAfterCheck == "0") {
                return;
            }
            if (soldSome) {
                soldSome = false;
                const _ = yield sell(tokenAccountInCommon.poolKeys.baseMint, tokenBalanceAfterCheck);
            }
            else {
                const _ = yield sell(tokenAccountInCommon.poolKeys.baseMint, accountData.amount);
            }
        }
    }
});
const getTokenBalance = (tokenAccount) => __awaiter(void 0, void 0, void 0, function* () {
    let tokenBalance = "0";
    let index = 0;
    do {
        try {
            const tokenBal = (yield solanaConnection.getTokenAccountBalance(tokenAccount, 'processed')).value;
            const uiAmount = tokenBal.uiAmount;
            if (index > 10) {
                break;
            }
            if (uiAmount && uiAmount > 0) {
                tokenBalance = tokenBal.amount;
                console.log(`Token balance is ${uiAmount}`);
                break;
            }
            yield sleep(1000);
            index++;
        }
        catch (error) {
            yield sleep(500);
        }
    } while (true);
    return tokenBalance;
});
function trackWallet(connection) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const wsolAta = yield (0, spl_token_1.getAssociatedTokenAddress)(spl_token_1.NATIVE_MINT, wallet.publicKey);
            connection.onLogs(wsolAta, (_a) => __awaiter(this, [_a], void 0, function* ({ logs, err, signature }) {
                if (err)
                    console.log("Transaction failed");
                else {
                    console.log(`\nTransaction success: https://solscan.io/tx/${signature}\n`);
                }
            }), "confirmed");
        }
        catch (error) {
            console.log("Transaction error : ", error);
        }
    });
}
const getPrice = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!poolId)
        return;
    try {
        // let poolId = new PublicKey("13bqEPVQewKAVbprEZVgqkmaCgSMsdBN9up5xfvLtXDV")
        const res = yield fetch(`https://api.dexscreener.com/latest/dex/pairs/solana/${poolId === null || poolId === void 0 ? void 0 : poolId.toBase58()}`, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            }
        });
        const data = yield res.clone().json();
        if (!data.pair) {
            return;
        }
        // console.log("🚀 ~ getprice ~ data:", data)
        // console.log("price data => ", data.pair.priceUsd)
        const { priceUsd, priceNative, volume, priceChange, liquidity, fdv, marketCap, pairCreatedAt, txns } = data.pair;
        const { m5: volume_m5, h1: volume_h1, h6: volume_h6 } = volume;
        const { m5: priceChange_m5, h1: priceChange_h1, h6: priceChange_h6 } = priceChange;
        // console.log(`Lq: $${(liquidity.usd / 1000).toFixed(3)}K | MC: $${(marketCap / 1000).toFixed(3)}K | Price: $${Number(priceUsd).toFixed(3)} | 5M: ${priceChange_m5}% | 1H: ${priceChange_h1}% | TXs: ${txns.h1.buys + txns.h1.sells} | Buy: ${txns.h1.buys} | Sell: ${txns.h1.sells} | Vol: $${(volume_h1 / 1000).toFixed(3)}K`)
        // console.log(`${priceUsd} ${priceNative} ${liquidity.usd} ${fdv} ${marketCap} ${pairCreatedAt} ${volume_m5} ${volume_h1} ${volume_h6} ${priceChange_m5} ${priceChange_h1} ${priceChange_h6}`)
        return {
            priceUsd,
            priceNative,
            liquidity,
            fdv,
            txns,
            marketCap,
            pairCreatedAt,
            volume_m5,
            volume_h1,
            volume_h6,
            priceChange_m5,
            priceChange_h1,
            priceChange_h6
        };
    }
    catch (e) {
        console.log("error in fetching price of pool", e);
        return;
    }
});
runListener();
// getPrice()
