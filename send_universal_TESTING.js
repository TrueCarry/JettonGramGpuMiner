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
    '--allow-shards': Boolean, // if true - allows mining to other shards
    '-c': String, // blockchain config
});
let givers = givers_1.givers1000;
if (args['--givers']) {
    const val = args['--givers'];
    const allowed = [100, 1000];
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
        // case 10000:
        //     givers = givers10000
        //     console.log('Using givers 10 000')
        //     break
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
const allowShards = (_c = args['--allow-shards']) !== null && _c !== void 0 ? _c : false;
console.log('Using GPU', gpu);
console.log('Using timeout', timeout);
const mySeed = process.env.SEED;
const totalDiff = BigInt('115792089237277217110272752943501742914102634520085823245724998868298727686144');
let bestGiver = { address: '', coins: 0 };
function updateBestGivers(liteClient, myAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        const whitelistGivers = allowShards ? [...givers] : givers.filter((giver) => {
            const shardMaxDepth = 1;
            const giverAddress = core_1.Address.parse(giver.address);
            const myShard = new core_1.BitReader(new core_1.BitString(myAddress.hash, 0, 1024)).loadUint(shardMaxDepth);
            const giverShard = new core_1.BitReader(new core_1.BitString(giverAddress.hash, 0, 1024)).loadUint(shardMaxDepth);
            if (myShard === giverShard) {
                return true;
            }
            return false;
        });
        console.log('Whitelist: ', whitelistGivers.length);
        if (liteClient instanceof ton_1.TonClient4) {
            const lastInfo = yield CallForSuccess(() => liteClient.getLastBlock());
            let newBestGiber = { address: '', coins: 0 };
            yield Promise.all(whitelistGivers.map((giver) => __awaiter(this, void 0, void 0, function* () {
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
            yield Promise.all(whitelistGivers.map((giver) => __awaiter(this, void 0, void 0, function* () {
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
function getNextMaster(liteClient) {
    return __awaiter(this, void 0, void 0, function* () {
        if (liteClient instanceof ton_lite_client_1.LiteClient) {
            const info = yield liteClient.getMasterchainInfo();
            const nextInfo = yield liteClient.getMasterchainInfo({ awaitSeqno: info.last.seqno + 1 });
            return nextInfo.last;
        }
        else {
            const info = yield liteClient.getLastBlock();
            while (true) {
                try {
                    const nextInfo = yield liteClient.getBlock(info.last.seqno + 1);
                    return nextInfo.shards.find(s => s.workchain === -1);
                }
                catch (e) {
                    //
                }
            }
            // const nextInfo = await liteClient.getBlock(info.last.seqno + 1)
            // return info.last.seqno + 1
        }
    });
}
function getPowInfo(liteClient, address, lastInfoRoot) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log('getPowInfo', address, lastInfoRoot)
        if (liteClient instanceof ton_1.TonClient4) {
            const lastInfo = lastInfoRoot !== null && lastInfoRoot !== void 0 ? lastInfoRoot : (yield CallForSuccess(() => liteClient.getLastBlock())).last;
            const powInfo = yield CallForSuccess(() => liteClient.runMethod(lastInfo.seqno, address, 'get_pow_params', []));
            const reader = new core_1.TupleReader(powInfo.result);
            const seed = reader.readBigNumber();
            const complexity = reader.readBigNumber();
            const iterations = reader.readBigNumber();
            return [seed, complexity, iterations];
        }
        else if (liteClient instanceof ton_lite_client_1.LiteClient) {
            // console.log('lastInfoRoot', lastInfoRoot)
            const lastInfo = lastInfoRoot !== null && lastInfoRoot !== void 0 ? lastInfoRoot : (yield liteClient.getMasterchainInfo()).last;
            const powInfo = yield liteClient.runMethod(address, 'get_pow_params', Buffer.from([]), lastInfo, { awaitSeqno: lastInfo.seqno, timeout: 100 });
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
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
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
        const walletv3r2 = ton_1.WalletContractV3R2.create({
            workchain: 0,
            publicKey: keyPair.publicKey
        });
        if (args['--wallet'] === 'highload') {
            console.log('Using highload wallet', wallet.address.toString({ bounceable: false, urlSafe: true }));
        }
        else {
            console.log('Using v4r2 wallet', wallet.address.toString({ bounceable: false, urlSafe: true }));
        }
        const opened = liteClient.open(wallet);
        yield updateBestGivers(liteClient, wallet.address);
        setInterval(() => {
            updateBestGivers(liteClient, wallet.address);
        }, 1000);
        while (go) {
            // console.log('waiting master')
            const nextMaster = yield getNextMaster(liteClient);
            console.log('got next master');
            const giverAddress = bestGiver.address;
            const [seed, complexity, iterations] = yield getPowInfo(liteClient, core_1.Address.parse(giverAddress), nextMaster);
            console.log('got giver address', giverAddress);
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
                // const [newSeed] = await getPowInfo(liteClient, Address.parse(giverAddress))
                // if (newSeed !== seed) {
                //     console.log('Mined already too late seed')
                //     continue
                // }
                console.log(`${new Date()}:     mined`, seed, i++);
                let w = opened;
                let seqno = 0;
                try {
                    seqno = yield CallForSuccess(() => w.getSeqno());
                }
                catch (e) {
                    //
                }
                sendMinedBoc(wallet, seqno, keyPair, giverAddress, core_1.Cell.fromBoc(mined)[0].asSlice().loadRef());
                // let seqnov3 = 0
                // try {
                //     seqnov3 = await CallForSuccess(() => liteClient.open(walletv3r2).getSeqno())
                // } catch (e) {
                //     //
                // }
                // sendMinedBoc(walletv3r2, seqnov3, keyPair, giverAddress, Cell.fromBoc(mined as Buffer)[0].asSlice().loadRef())
                // for (let j = 0; j < 5; j++) {
                //     try {
                //         await CallForSuccess(() => {
                //             return w.sendTransfer({
                //                 seqno,
                //                 secretKey: keyPair.secretKey,
                //                 messages: [internal({
                //                     to: giverAddress,
                //                     value: toNano('0.05'),
                //                     bounce: true,
                //                     body: Cell.fromBoc(mined as Buffer)[0].asSlice().loadRef(),
                //                 })],
                //                 sendMode: 3 as any,
                //             })
                //         })
                //         break
                //     } catch (e) {
                //         if (j === 4) {
                //             throw e
                //         }
                //         //
                //     }
                // }
            }
        }
    });
}
main();
function sendMinedBoc(wallet, seqno, keyPair, giverAddress, boc) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const liteServerClient = yield (0, client_1.getLiteClient)((_a = args['-c']) !== null && _a !== void 0 ? _a : 'https://ton-blockchain.github.io/global.config.json');
        const ton4Client = yield (0, client_1.getTon4Client)();
        const tonOrbsClient = yield (0, client_1.getTon4ClientOrbs)();
        const toncenterClient = yield (0, client_1.getTonCenterClient)();
        const w1 = liteServerClient.open(wallet);
        const w2 = ton4Client.open(wallet);
        const w3 = tonOrbsClient.open(wallet);
        const w4 = toncenterClient.open(wallet);
        const wallets = [w1, w2, w3];
        // const transferBoc = w1.createTransfer({
        //     seqno,
        //     secretKey: keyPair.secretKey,
        //     messages: [internal({
        //         to: giverAddress,
        //         value: toNano('0.05'),
        //         bounce: true,
        //         body: boc,
        //     })],
        //     sendMode: 3 as any,
        // })
        // console.log('send seqno', seqno)
        // const ext = external({
        //     to: Address.parse(giverAddress),
        //     body: transferBoc
        // })
        // const dataBoc = beginCell().store(storeMessage(ext)).endCell()
        // toncenterClient.sendFile(dataBoc.toBoc()).then(() => {
        //     console.log('toncenter success')
        // }).catch(e => {
        //     //
        //     console.log('toncenter send error', e)
        // })
        // w4.sendTransfer({
        //     seqno,
        //     secretKey: keyPair.secretKey,
        //     messages: [internal({
        //         to: giverAddress,
        //         value: toNano('0.05'),
        //         bounce: true,
        //         body: boc,
        //     })],
        //     sendMode: 3 as any,
        // })
        for (let i = 0; i < 3; i++) {
            for (const w of wallets) {
                w.sendTransfer({
                    seqno,
                    secretKey: keyPair.secretKey,
                    messages: [(0, core_1.internal)({
                            to: giverAddress,
                            value: (0, core_1.toNano)('0.05'),
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
