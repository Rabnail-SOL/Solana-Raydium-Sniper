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
exports.checkSocial = exports.checkMutable = exports.checkBurn = void 0;
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const mpl_token_metadata_1 = require("@metaplex-foundation/mpl-token-metadata");
const checkBurn = (connection, lpMint, commitment) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const amount = yield connection.getTokenSupply(lpMint, commitment);
        const burned = amount.value.uiAmount === 0;
        return burned;
    }
    catch (error) {
        return false;
    }
});
exports.checkBurn = checkBurn;
const checkMutable = (connection, baseMint) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const metadataPDA = (0, raydium_sdk_1.getPdaMetadataKey)(baseMint);
        const metadataAccount = yield connection.getAccountInfo(metadataPDA.publicKey);
        if (!(metadataAccount === null || metadataAccount === void 0 ? void 0 : metadataAccount.data)) {
            return { ok: false, message: 'Mutable -> Failed to fetch account data' };
        }
        const serializer = (0, mpl_token_metadata_1.getMetadataAccountDataSerializer)();
        const deserialize = serializer.deserialize(metadataAccount.data);
        const mutable = deserialize[0].isMutable;
        return !mutable;
    }
    catch (e) {
        return false;
    }
});
exports.checkMutable = checkMutable;
const checkSocial = (connection, baseMint, commitment) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const serializer = (0, mpl_token_metadata_1.getMetadataAccountDataSerializer)();
        const metadataPDA = (0, raydium_sdk_1.getPdaMetadataKey)(baseMint);
        const metadataAccount = yield connection.getAccountInfo(metadataPDA.publicKey, commitment);
        if (!(metadataAccount === null || metadataAccount === void 0 ? void 0 : metadataAccount.data)) {
            return { ok: false, message: 'Mutable -> Failed to fetch account data' };
        }
        const deserialize = serializer.deserialize(metadataAccount.data);
        const social = yield hasSocials(deserialize[0]);
        return social;
    }
    catch (error) {
        return false;
    }
});
exports.checkSocial = checkSocial;
function hasSocials(metadata) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const response = yield fetch(metadata.uri);
        const data = yield response.json();
        return Object.values((_a = data === null || data === void 0 ? void 0 : data.extensions) !== null && _a !== void 0 ? _a : {}).some((value) => value !== null && value.length > 0);
    });
}
