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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = exports.CallForSuccess = void 0;
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
const ton_lite_client_1 = require("ton-lite-client");
const client_1 = require("./client");
dotenv_1.default.config({ path: 'config.txt.txt' });
dotenv_1.default.config({ path: '.env.txt' });
dotenv_1.default.config();
dotenv_1.default.config({ path: 'config.txt' });
const args = (0, arg_1.default)({
    '--givers': Number, // 100 1000 10000
    '--api': String, // lite, tonhub
    '--bin': String, // cuda, opencl or path to miner
    '--gpu': Number, // gpu id, default 0
    '--timeout': Number, // Timeout for mining in seconds
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
            console.log('Using givers 100');
            break;
        case 1000:
            givers = givers_1.givers1000;
            console.log('Using givers 1 000');
            break;
        case 10000:
            givers = givers_1.givers10000;
            console.log('Using givers 10 000');
            break;
    }
}
else {
    console.log('Using givers 10 000');
}
let bin = '.\\pow-miner-cuda.exe';
if (args['--bin']) {
    const argBin = args['--bin'];
    if (argBin === 'cuda') {
        bin = '.\\pow-miner-cuda.exe';
    }
    else if (argBin === 'opencl' || argBin === 'amd') {
        bin = '.\\pow-miner-opencl.exe';
    }
    else {
        bin = argBin;
    }
}
console.log('Using bin', bin);
const gpu = (_a = args['--gpu']) !== null && _a !== void 0 ? _a : 0;
const timeout = (_b = args['--timeout']) !== null && _b !== void 0 ? _b : 5;
console.log('Using GPU', gpu);
console.log('Using timeout', timeout);
const mySeed = process.env.SEED;
const totalDiff = BigInt('115792089237277217110272752943501742914102634520085823245724998868298727686144');
let bestGiver = { address: '', coins: 0 };
function updateBestGivers(liteClient) {
    return __awaiter(this, void 0, void 0, function* () {
        if (liteClient instanceof ton_1.TonClient4) {
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
        }
        else if (liteClient instanceof ton_lite_client_1.LiteClient) {
            const lastInfo = yield liteClient.getMasterchainInfo();
            let newBestGiber = { address: '', coins: 0 };
            yield Promise.all(givers.map((giver) => __awaiter(this, void 0, void 0, function* () {
                const powInfo = yield liteClient.runMethod(core_1.Address.parse(giver.address), 'get_pow_params', Buffer.from([]), lastInfo.last);
                const powStack = core_1.Cell.fromBase64(powInfo.result);
                const stack = (0, core_1.parseTuple)(powStack);
                const reader = new core_1.TupleReader(stack);
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
        }
    });
}
function getPowInfo(liteClient, address) {
    return __awaiter(this, void 0, void 0, function* () {
        if (liteClient instanceof ton_1.TonClient4) {
            const lastInfo = yield CallForSuccess(() => liteClient.getLastBlock());
            const powInfo = yield CallForSuccess(() => liteClient.runMethod(lastInfo.last.seqno, address, 'get_pow_params', []));
            const reader = new core_1.TupleReader(powInfo.result);
            const seed = reader.readBigNumber();
            const complexity = reader.readBigNumber();
            const iterations = reader.readBigNumber();
            return [seed, complexity, iterations];
        }
        else if (liteClient instanceof ton_lite_client_1.LiteClient) {
            const lastInfo = yield liteClient.getMasterchainInfo();
            const powInfo = yield liteClient.runMethod(address, 'get_pow_params', Buffer.from([]), lastInfo.last);
            const powStack = core_1.Cell.fromBase64(powInfo.result);
            const stack = (0, core_1.parseTuple)(powStack);
            const reader = new core_1.TupleReader(stack);
            const seed = reader.readBigNumber();
            const complexity = reader.readBigNumber();
            const iterations = reader.readBigNumber();
            return [seed, complexity, iterations];
        }
        throw new Error('invalid client');
    });
}
let go = true;
let i = 0;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let liteClient;
        if (!args['--api']) {
            console.log('Using TonHub API');
            liteClient = yield (0, client_1.getTon4Client)();
        }
        else {
            if (args['--api'] === 'lite') {
                console.log('Using LiteServer API');
                liteClient = yield (0, client_1.getLiteClient)('https://ton-blockchain.github.io/global.config.json');
            }
            else {
                console.log('Using TonHub API');
                liteClient = yield (0, client_1.getTon4Client)();
            }
        }
        const keyPair = yield (0, crypto_1.mnemonicToWalletKey)(mySeed.split(' '));
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
            const [seed, complexity, iterations] = yield getPowInfo(liteClient, core_1.Address.parse(giverAddress));
            const randomName = (yield (0, crypto_1.getSecureRandomBytes)(8)).toString('hex') + '.boc';
            const path = `bocs/${randomName}`;
            const command = `${bin} -g ${gpu} -F 128 -t ${timeout} ${wallet.address.toString({ urlSafe: true, bounceable: true })} ${seed} ${complexity} ${iterations} ${giverAddress} ${path}`;
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
                const [newSeed] = yield getPowInfo(liteClient, core_1.Address.parse(giverAddress));
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
