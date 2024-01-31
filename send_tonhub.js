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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = exports.CallForSuccess = exports.getClient = exports.intToIP = void 0;
const core_1 = require("@ton/core");
const crypto_1 = require("@ton/crypto");
// import { LiteClient, LiteRoundRobinEngine, LiteSingleEngine } from 'ton-lite-client'
const ton_1 = require("@ton/ton");
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const ton_2 = require("@ton/ton");
const dotenv_1 = __importDefault(require("dotenv"));
const givers_1 = require("./givers");
const arg_1 = __importDefault(require("arg"));
dotenv_1.default.config({ path: 'config.txt.txt' });
dotenv_1.default.config({ path: '.env.txt' });
dotenv_1.default.config();
dotenv_1.default.config({ path: 'config.txt' });
const args = (0, arg_1.default)({
    '--givers': Number,
});
let givers = givers_1.givers10000;
if (args['--givers']) {
    const val = args['--givers'];
    const allowed = [100, 1000, 10000];
    if (!allowed.includes(val)) {
        throw new Error('Invalid --givers argument');
    }
    switch (val) {
        case 100:
            givers = givers_1.givers100;
            break;
        case 1000:
            givers = givers_1.givers1000;
            break;
        case 10000:
            givers = givers_1.givers10000;
            break;
    }
}
const mySeed = process.env.SEED;
const totalDiff = BigInt('115792089237277217110272752943501742914102634520085823245724998868298727686144');
let lc = undefined;
let createLiteClient;
let bestGiver = { address: '', coins: 0 };
function updateBestGivers(liteClient) {
    return __awaiter(this, void 0, void 0, function* () {
        const lastInfo = yield CallForSuccess(() => liteClient.getLastBlock());
        let newBestGiber = { address: '', coins: 0 };
        yield Promise.all(givers.map((giver) => __awaiter(this, void 0, void 0, function* () {
            const stack = yield CallForSuccess(() => liteClient.runMethod(lastInfo.last.seqno, core_1.Address.parse(giver.address), 'get_pow_params', []));
            // const powStack = Cell.fromBase64(powInfo.result as string)
            // const stack = parseTuple(powStack)
            const reader = new core_1.TupleReader(stack.result);
            const seed = reader.readBigNumber();
            const complexity = reader.readBigNumber();
            const iterations = reader.readBigNumber();
            const hashes = totalDiff / complexity;
            const coinsPerHash = giver.reward / Number(hashes);
            if (coinsPerHash > newBestGiber.coins) {
                newBestGiber = { address: giver.address, coins: coinsPerHash };
            }
        })));
        bestGiver = newBestGiber;
    });
}
let go = true;
let i = 0;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const keyPair = yield (0, crypto_1.mnemonicToWalletKey)(mySeed.split(' '));
        const liteClient = yield getClient();
        const wallet = ton_2.WalletContractV4.create({
            workchain: 0,
            publicKey: keyPair.publicKey
        });
        const opened = liteClient.open(wallet);
        yield updateBestGivers(liteClient);
        setInterval(() => {
            updateBestGivers(liteClient);
        }, 1000);
        while (go) {
            const giverAddress = bestGiver.address;
            const lastInfo = yield CallForSuccess(() => liteClient.getLastBlock());
            const powInfo = yield CallForSuccess(() => liteClient.runMethod(lastInfo.last.seqno, core_1.Address.parse(giverAddress), 'get_pow_params', []));
            // const powStack = Cell.fromBase64(powInfo.result as string)
            // const stack = parseTuple(powStack)
            const reader = new core_1.TupleReader(powInfo.result);
            const seed = reader.readBigNumber();
            const complexity = reader.readBigNumber();
            const iterations = reader.readBigNumber();
            const randomName = (yield (0, crypto_1.getSecureRandomBytes)(8)).toString('hex') + '.boc';
            const path = `bocs/${randomName}`;
            const command = `.\\pow-miner-cuda.exe -g 0 -F 128 -t 5 ${wallet.address.toString({ urlSafe: true, bounceable: true })} ${seed} ${complexity} ${iterations} ${giverAddress} ${path}`;
            try {
                const output = (0, child_process_1.execSync)(command, { encoding: 'utf-8', stdio: "pipe" }); // the default is 'buffer'
            }
            catch (e) {
            }
            let mined = undefined;
            try {
                mined = fs_1.default.readFileSync(path);
                fs_1.default.rmSync(path);
            }
            catch (e) {
                //
            }
            if (!mined) {
                console.log(`${new Date()}: not mined`, seed, i++);
            }
            if (mined) {
                const lastInfo = yield CallForSuccess(() => liteClient.getLastBlock());
                const powInfo = yield CallForSuccess(() => liteClient.runMethod(lastInfo.last.seqno, core_1.Address.parse(giverAddress), 'get_pow_params', []));
                // const powStack = Cell.fromBase64(powInfo.result as string)
                // const stack = parseTuple(powStack)
                const reader = new core_1.TupleReader(powInfo.result);
                const newSeed = reader.readBigNumber();
                if (newSeed !== seed) {
                    console.log('Mined already too late seed');
                    continue;
                }
                console.log(`${new Date()}:     mined`, seed, i++);
                let seqno = 0;
                try {
                    seqno = yield CallForSuccess(() => opened.getSeqno());
                }
                catch (e) {
                    //
                }
                for (let j = 0; j < 5; j++) {
                    try {
                        yield CallForSuccess(() => {
                            return opened.sendTransfer({
                                seqno,
                                secretKey: keyPair.secretKey,
                                messages: [(0, core_1.internal)({
                                        to: giverAddress,
                                        value: (0, core_1.toNano)('0.05'),
                                        bounce: true,
                                        body: core_1.Cell.fromBoc(mined)[0].asSlice().loadRef(),
                                    })],
                                sendMode: 3,
                            });
                        });
                        break;
                    }
                    catch (e) {
                        if (j === 4) {
                            throw e;
                        }
                        //
                    }
                }
            }
        }
    });
}
main();
function intToIP(int) {
    const part1 = int & 255;
    const part2 = (int >> 8) & 255;
    const part3 = (int >> 16) & 255;
    const part4 = (int >> 24) & 255;
    return `${part4}.${part3}.${part2}.${part1}`;
}
exports.intToIP = intToIP;
function getClient(_configUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        if (lc) {
            return lc;
        }
        lc = new ton_1.TonClient4({ endpoint: _configUrl !== null && _configUrl !== void 0 ? _configUrl : 'https://mainnet-v4.tonhubapi.com' });
        return lc;
    });
}
exports.getClient = getClient;
// Function to call ton api untill we get response.
// Because testnet is pretty unstable we need to make sure response is final
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CallForSuccess(toCall, attempts = 20, delayMs = 100) {
    return __awaiter(this, void 0, void 0, function* () {
        if (typeof toCall !== 'function') {
            throw new Error('unknown input');
        }
        let i = 0;
        let lastError;
        while (i < attempts) {
            try {
                const res = yield toCall();
                return res;
            }
            catch (err) {
                lastError = err;
                i++;
                yield delay(delayMs);
            }
        }
        console.log('error after attempts', i);
        throw lastError;
    });
}
exports.CallForSuccess = CallForSuccess;
function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
exports.delay = delay;
