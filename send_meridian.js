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
var _a, _b, _c;
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
const givers_meridian_1 = require("./givers_meridian");
const arg_1 = __importDefault(require("arg"));
const ton_lite_client_1 = require("ton-lite-client");
const client_1 = require("./client");
const tonapi_sdk_js_1 = require("tonapi-sdk-js");
dotenv_1.default.config({ path: 'config.txt.txt' });
dotenv_1.default.config({ path: '.env.txt' });
dotenv_1.default.config();
dotenv_1.default.config({ path: 'config.txt' });
const args = (0, arg_1.default)({
    '--givers': Number, // 100 1000 10000 100000
    '--api': String, // lite, tonhub, tonapi
    '--bin': String, // cuda, opencl or path to miner
    '--gpu': Number, // gpu id, default 0
    '--timeout': Number, // Timeout for mining in seconds
    '--allow-shards': Boolean, // if true - allows mining to other shards
    '-c': String, // blockchain config
});
let givers = givers_meridian_1.givers1000;
if (args['--givers']) {
    const val = args['--givers'];
    const allowed = [100, 1000, 10000, 100000];
    if (!allowed.includes(val)) {
        throw new Error('Invalid --givers argument');
    }
    switch (val) {
        case 100:
            givers = givers_meridian_1.givers100;
            console.log('Using givers 100');
            break;
        case 1000:
            givers = givers_meridian_1.givers1000;
            console.log('Using givers 1 000');
            break;
        case 10000:
            givers = givers_meridian_1.givers10000;
            console.log('Using givers 10 000');
            break;
        case 100000:
            givers = givers_meridian_1.givers100000;
            console.log('Using givers 100 000');
            break;
    }
}
else {
    console.log('Using givers 1 000');
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
const allowShards = (_c = args['--allow-shards']) !== null && _c !== void 0 ? _c : false;
console.log('Using GPU', gpu);
console.log('Using timeout', timeout);
const mySeed = process.env.SEED;
const totalDiff = BigInt('115792089237277217110272752943501742914102634520085823245724998868298727686144');
const envAddress = process.env.TARGET_ADDRESS;
let TARGET_ADDRESS = undefined;
if (envAddress) {
    try {
        TARGET_ADDRESS = core_1.Address.parse(envAddress).toString({ urlSafe: true, bounceable: false });
    }
    catch (e) {
        console.log('Couldnt parse target address');
        process.exit(1);
    }
}
let bestGiver = { address: '', coins: 0 };
function updateBestGivers(liteClient, myAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        const giver = givers[Math.floor(Math.random() * givers.length)];
        bestGiver = {
            address: giver.address,
            coins: giver.reward,
        };
    });
}
function getPowInfo(liteClient, address) {
    return __awaiter(this, void 0, void 0, function* () {
        if (liteClient instanceof ton_1.TonClient4) {
            const lastInfo = yield CallForSuccess(() => liteClient.getLastBlock());
            const powInfo = yield CallForSuccess(() => liteClient.runMethod(lastInfo.last.seqno, address, 'get_mining_status', []));
            // console.log('pow info', powInfo, powInfo.result)
            const reader = new core_1.TupleReader(powInfo.result);
            const complexity = reader.readBigNumber();
            const iterations = reader.readBigNumber();
            const seed = reader.readBigNumber();
            const A = reader.readBigNumber();
            const B = reader.readBigNumber();
            const C = reader.readBigNumber();
            const left = reader.readBigNumber();
            // const left = BigInt(powInfo.stack[6].num as string)
            if (left < BigInt(1)) {
                throw new Error('no mrdn left');
            }
            return [seed, complexity, iterations];
        }
        else if (liteClient instanceof ton_lite_client_1.LiteClient) {
            const lastInfo = yield liteClient.getMasterchainInfo();
            const powInfo = yield liteClient.runMethod(address, 'get_mining_status', Buffer.from([]), lastInfo.last);
            const powStack = core_1.Cell.fromBase64(powInfo.result);
            const stack = (0, core_1.parseTuple)(powStack);
            // console.log('pow stack', stack)
            const reader = new core_1.TupleReader(stack);
            const complexity = reader.readBigNumber();
            const iterations = reader.readBigNumber();
            const seed = reader.readBigNumber();
            const A = reader.readBigNumber();
            const B = reader.readBigNumber();
            const C = reader.readBigNumber();
            const left = reader.readBigNumber();
            // const left = BigInt(powInfo.stack[6].num as string)
            if (left < BigInt(1)) {
                throw new Error('no mrdn left');
            }
            return [seed, complexity, iterations];
        }
        else if (liteClient instanceof tonapi_sdk_js_1.Api) {
            try {
                const powInfo = yield CallForSuccess(() => liteClient.blockchain.execGetMethodForBlockchainAccount(address.toRawString(), 'get_mining_status', {}), 50, 300);
                // console.log('pow', powInfo.stack)
                const complexity = BigInt(powInfo.stack[0].num);
                const seed = BigInt(powInfo.stack[2].num);
                const iterations = BigInt(powInfo.stack[1].num);
                const left = BigInt(powInfo.stack[6].num);
                if (left < BigInt(1)) {
                    throw new Error('no mrdn left');
                }
                // console.log('pow stack', powInfo.stack)
                return [seed, complexity, iterations];
            }
            catch (e) {
                console.log('ls error', e);
            }
        }
        throw new Error('invalid client');
    });
}
let go = true;
let i = 0;
let success = 0;
let lastMinedSeed = BigInt(0);
let start = Date.now();
function main() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const minerOk = yield testMiner();
        if (!minerOk) {
            console.log('Your miner is not working');
            console.log('Check if you use correct bin (cuda, amd).');
            console.log('If it doesn\'t help, try to run test_cuda or test_opencl script, to find out issue');
            process.exit(1);
        }
        let liteClient;
        if (!args['--api']) {
            console.log('Using TonHub API');
            liteClient = yield (0, client_1.getTon4Client)();
        }
        else {
            if (args['--api'] === 'lite') {
                console.log('Using LiteServer API');
                liteClient = yield (0, client_1.getLiteClient)((_a = args['-c']) !== null && _a !== void 0 ? _a : 'https://ton-blockchain.github.io/global.config.json');
            }
            else if (args['--api'] === 'tonapi') {
                console.log('Using TonApi');
                liteClient = yield (0, client_1.getTonapiClient)();
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
        if (args['--wallet'] === 'highload') {
            console.log('Using highload wallet', wallet.address.toString({ bounceable: false, urlSafe: true }));
        }
        else {
            console.log('Using v4r2 wallet', wallet.address.toString({ bounceable: false, urlSafe: true }));
        }
        const targetAddress = TARGET_ADDRESS !== null && TARGET_ADDRESS !== void 0 ? TARGET_ADDRESS : wallet.address.toString({ bounceable: false, urlSafe: true });
        console.log('Target address:', targetAddress);
        console.log('Date, time, status, seed, attempts, successes, timespent');
        try {
            yield updateBestGivers(liteClient, wallet.address);
        }
        catch (e) {
            console.log('error', e);
            throw Error('no givers');
        }
        setInterval(() => {
            updateBestGivers(liteClient, wallet.address);
        }, 5000);
        while (go) {
            const giverAddress = bestGiver.address;
            const [seed, complexity, iterations] = yield getPowInfo(liteClient, core_1.Address.parse(giverAddress));
            if (seed === lastMinedSeed) {
                // console.log('Wating for a new seed')
                updateBestGivers(liteClient, wallet.address);
                yield delay(200);
                continue;
            }
            const randomName = (yield (0, crypto_1.getSecureRandomBytes)(8)).toString('hex') + '.boc';
            const path = `bocs/${randomName}`;
            const command = `${bin} -g ${gpu} -F 128 -t ${timeout} ${targetAddress} ${seed} ${complexity} 999999999999999 ${giverAddress} ${path}`;
            // console.log('cmd', command)
            let output;
            try {
                output = (0, child_process_1.execSync)(command, { encoding: 'utf-8', stdio: "pipe" }); // the default is 'buffer'
            }
            catch (e) {
            }
            let mined = undefined;
            try {
                mined = fs_1.default.readFileSync(path);
                lastMinedSeed = seed;
                fs_1.default.rmSync(path);
            }
            catch (e) {
                //
            }
            if (!mined) {
                console.log(`${formatTime()}: not mined`, seed.toString(16).slice(0, 4), i++, success, Math.floor((Date.now() - start) / 1000));
            }
            if (mined) {
                const [newSeed] = yield getPowInfo(liteClient, core_1.Address.parse(giverAddress));
                if (newSeed !== seed) {
                    console.log('Mined already too late seed');
                    continue;
                }
                console.log(`${formatTime()}:     mined`, seed.toString(16).slice(0, 4), i++, ++success, Math.floor((Date.now() - start) / 1000));
                let seqno = 0;
                if (liteClient instanceof ton_lite_client_1.LiteClient || liteClient instanceof ton_1.TonClient4) {
                    let w = liteClient.open(wallet);
                    try {
                        seqno = yield CallForSuccess(() => w.getSeqno());
                    }
                    catch (e) {
                        //
                    }
                }
                else {
                    const res = yield CallForSuccess(() => liteClient.blockchain.execGetMethodForBlockchainAccount(wallet.address.toRawString(), "seqno", {}), 50, 250);
                    if (res.success) {
                        seqno = Number(BigInt(res.stack[0].num));
                    }
                }
                yield sendMinedBoc(wallet, seqno, keyPair, giverAddress, core_1.Cell.fromBoc(mined)[0].asSlice().loadRef());
            }
        }
    });
}
main();
function sendMinedBoc(wallet, seqno, keyPair, giverAddress, boc) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (args['--api'] === 'tonapi') {
            const tonapiClient = yield (0, client_1.getTonapiClient)();
            const transfer = wallet.createTransfer({
                seqno,
                secretKey: keyPair.secretKey,
                messages: [(0, core_1.internal)({
                        to: giverAddress,
                        value: (0, core_1.toNano)('0.08'),
                        bounce: true,
                        body: boc,
                    })],
                sendMode: 3,
            });
            const msg = (0, core_1.beginCell)().store((0, core_1.storeMessage)((0, core_1.external)({
                to: wallet.address,
                body: transfer
            }))).endCell();
            let k = 0;
            let lastError;
            while (k < 20) {
                try {
                    yield tonapiClient.blockchain.sendBlockchainMessage({
                        boc: msg.toBoc().toString('base64'),
                    });
                    break;
                    // return res
                }
                catch (e) {
                    // lastError = err
                    k++;
                    if (e.status === 429) {
                        yield delay(200);
                    }
                    else {
                        // console.log('tonapi error')
                        k = 20;
                        break;
                    }
                }
            }
            return;
        }
        const wallets = [];
        const ton4Client = yield (0, client_1.getTon4Client)();
        const w2 = ton4Client.open(wallet);
        wallets.push(w2);
        if (args['--api'] === 'lite') {
            const liteServerClient = yield (0, client_1.getLiteClient)((_a = args['-c']) !== null && _a !== void 0 ? _a : 'https://ton-blockchain.github.io/global.config.json');
            const w1 = liteServerClient.open(wallet);
            wallets.push(w1);
        }
        for (let i = 0; i < 3; i++) {
            for (const w of wallets) {
                w.sendTransfer({
                    seqno,
                    secretKey: keyPair.secretKey,
                    messages: [(0, core_1.internal)({
                            to: giverAddress,
                            value: (0, core_1.toNano)('0.08'),
                            bounce: true,
                            body: boc,
                        })],
                    sendMode: 3,
                }).catch(e => {
                    //
                });
            }
        }
    });
}
function testMiner() {
    return __awaiter(this, void 0, void 0, function* () {
        const randomName = (yield (0, crypto_1.getSecureRandomBytes)(8)).toString('hex') + '.boc';
        const path = `bocs/${randomName}`;
        const command = `${bin} -g ${gpu} -F 128 -t ${timeout} kQBWkNKqzCAwA9vjMwRmg7aY75Rf8lByPA9zKXoqGkHi8SM7 229760179690128740373110445116482216837 53919893334301279589334030174039261347274288845081144962207220498400000000000 10000000000 kQBWkNKqzCAwA9vjMwRmg7aY75Rf8lByPA9zKXoqGkHi8SM7 ${path}`;
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
            return false;
        }
        return true;
    });
}
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
function formatTime() {
    return new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: "numeric",
        minute: "numeric",
        day: "numeric",
        month: "numeric",
        year: "numeric",
        second: "numeric"
    });
}
