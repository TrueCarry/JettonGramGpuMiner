import { Address, BitReader, BitString, Cell, TupleReader, beginCell, external, internal, parseTuple, storeMessage, toNano } from '@ton/core'
import { KeyPair, getSecureRandomBytes, keyPairFromSeed, mnemonicToWalletKey } from '@ton/crypto'
import axios from 'axios'
// import { LiteClient, LiteRoundRobinEngine, LiteSingleEngine } from 'ton-lite-client'
import { TonClient4 } from '@ton/ton';
import { execSync } from 'child_process';
import fs from 'fs'
import { WalletContractV4 } from '@ton/ton';
import dotenv from 'dotenv'
import { givers1000, givers10000, givers100000 } from './givers_gpu'
import arg from 'arg'
import { LiteClient, LiteSingleEngine, LiteRoundRobinEngine } from 'ton-lite-client';
import { getLiteClient, getTon4Client, getTonCenterClient, getTonapiClient } from './client';
import { HighloadWalletV2 } from '@scaleton/highload-wallet';
import { OpenedContract } from '@ton/core';
import { Api } from 'tonapi-sdk-js';

dotenv.config({ path: 'config.txt.txt' })
dotenv.config({ path: '.env.txt' })
dotenv.config()
dotenv.config({ path: 'config.txt' })

type ApiObj = LiteClient | TonClient4 | Api<unknown>

const args = arg({
    '--givers': Number, // 1000 10000 100000
    '--api': String, // lite, tonhub, tonapi
    '--bin': String, // cuda, opencl or path to miner
    '--gpu': Number, // gpu id, default 0
    '--timeout': Number, // Timeout for mining in seconds
    '--allow-shards': Boolean, // if true - allows mining to other shards
    '-c': String,  // blockchain config
})


let givers = givers1000
if (args['--givers']) {
    const val = args['--givers']
    const allowed = [1000, 10000, 100000]
    if (!allowed.includes(val)) {
        throw new Error('Invalid --givers argument')
    }

    switch (val) {
        case 1000:
            givers = givers1000
            console.log('Using givers 1 000')
            break
        case 10000:
            givers = givers10000
            console.log('Using givers 10 000')
            break
        case 100000:
            givers = givers100000
            console.log('Using givers 100 000')
            break
    }
} else {
    console.log('Using givers 1 000')
}

let bin = '.\\pow-miner-cuda.exe'
if (args['--bin']) {
    const argBin = args['--bin']
    if (argBin === 'cuda') {
        bin = '.\\pow-miner-cuda.exe'
    } else if (argBin === 'opencl' || argBin === 'amd') {
        bin = '.\\pow-miner-opencl.exe'
    } else {
        bin = argBin
    }
}
console.log('Using bin', bin)

const gpu = args['--gpu'] ?? 0
const timeout = args['--timeout'] ?? 5

const allowShards = args['--allow-shards'] ?? false

console.log('Using GPU', gpu)
console.log('Using timeout', timeout)

const mySeed = process.env.SEED as string
const totalDiff = BigInt('115792089237277217110272752943501742914102634520085823245724998868298727686144')

const envAddress = process.env.TARGET_ADDRESS
let TARGET_ADDRESS: string | undefined = undefined
if (envAddress) {
    try {
        TARGET_ADDRESS = Address.parse(envAddress).toString({ urlSafe: true, bounceable: false })
    }
    catch (e) {
        console.log('Couldnt parse target address')
        process.exit(1)
    }
}



let bestGiver: { address: string, coins: number } = { address: '', coins: 0 }
async function updateBestGivers(liteClient: ApiObj, myAddress: Address) {
    const giver = givers[Math.floor(Math.random() * givers.length)]
    bestGiver = {
        address: giver.address,
        coins: giver.reward,
    }
}

async function getPowInfo(liteClient: ApiObj, address: Address): Promise<[bigint, bigint, bigint]> {
    if (liteClient instanceof TonClient4) {
        const lastInfo = await CallForSuccess(() => liteClient.getLastBlock())
        const powInfo = await CallForSuccess(() => liteClient.runMethod(lastInfo.last.seqno, address, 'get_pow_params', []))

        // console.log('pow info', powInfo, powInfo.result)

        const reader = new TupleReader(powInfo.result)
        const seed = reader.readBigNumber()
        const complexity = reader.readBigNumber()
        const iterations = reader.readBigNumber()

        return [seed, complexity, iterations]
    } else if (liteClient instanceof LiteClient) {
        const lastInfo = await liteClient.getMasterchainInfo()
        const powInfo = await liteClient.runMethod(address, 'get_pow_params', Buffer.from([]), lastInfo.last)
        const powStack = Cell.fromBase64(powInfo.result as string)
        const stack = parseTuple(powStack)

        const reader = new TupleReader(stack)
        const seed = reader.readBigNumber()
        const complexity = reader.readBigNumber()
        const iterations = reader.readBigNumber()

        return [seed, complexity, iterations]
    } else if (liteClient instanceof Api) {
        try {
            const powInfo = await CallForSuccess(
                () => liteClient.blockchain.execGetMethodForBlockchainAccount(address.toRawString(), 'get_pow_params', {}),
                50,
                300)

            const seed = BigInt(powInfo.stack[0].num as string)
            const complexity = BigInt(powInfo.stack[1].num as string)
            const iterations = BigInt(powInfo.stack[2].num as string)

            return [seed, complexity, iterations]
        } catch (e) {
            console.log('ls error', e)
        }
    }
    throw new Error('invalid client')
}

let go = true
let i = 0
let success = 0
let lastMinedSeed: bigint = BigInt(0)
let start = Date.now()

async function main() {
    const minerOk = await testMiner()
    if (!minerOk) {
        console.log('Your miner is not working')
        console.log('Check if you use correct bin (cuda, amd).')
        console.log('If it doesn\'t help, try to run test_cuda or test_opencl script, to find out issue')
        process.exit(1)
    }

    let liteClient: ApiObj
    if (!args['--api']) {
        console.log('Using TonHub API')
        liteClient = await getTon4Client()
    } else {
        if (args['--api'] === 'lite') {
            console.log('Using LiteServer API')
            liteClient = await getLiteClient(args['-c'] ?? 'https://ton-blockchain.github.io/global.config.json')
        } else if (args['--api'] === 'tonapi') {
            console.log('Using TonApi')
            liteClient = await getTonapiClient()
        } else {
            console.log('Using TonHub API')
            liteClient = await getTon4Client()
        }

    }

    const keyPair = await mnemonicToWalletKey(mySeed.split(' '))
    const wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: keyPair.publicKey
    })
    if (args['--wallet'] === 'highload') {
        console.log('Using highload wallet', wallet.address.toString({ bounceable: false, urlSafe: true }))
    } else {
        console.log('Using v4r2 wallet', wallet.address.toString({ bounceable: false, urlSafe: true }))
    }

    const targetAddress = TARGET_ADDRESS ?? wallet.address.toString({ bounceable: false, urlSafe: true })
    console.log('Target address:', targetAddress)
    console.log('Date, time, status, seed, attempts, successes, timespent')

    try {
        await updateBestGivers(liteClient, wallet.address)
    } catch (e) {
        console.log('error', e)
        throw Error('no givers')
    }

    setInterval(() => {
        updateBestGivers(liteClient, wallet.address)
    }, 5000)

    while (go) {
        const giverAddress = bestGiver.address
        const [seed, complexity, iterations] = await getPowInfo(liteClient, Address.parse(giverAddress))
        if (seed === lastMinedSeed) {
            // console.log('Wating for a new seed')
            updateBestGivers(liteClient, wallet.address)
            await delay(200)
            continue
        }

        const randomName = (await getSecureRandomBytes(8)).toString('hex') + '.boc'
        const path = `bocs/${randomName}`
        const command = `${bin} -g ${gpu} -F 128 -t ${timeout} ${targetAddress} ${seed} ${complexity} ${iterations} ${giverAddress} ${path}`
        try {
            const output = execSync(command, { encoding: 'utf-8', stdio: "pipe" });  // the default is 'buffer'
        } catch (e) {
        }
        let mined: Buffer | undefined = undefined
        try {
            mined = fs.readFileSync(path)
            lastMinedSeed = seed
            fs.rmSync(path)
        } catch (e) {
            //
        }
        if (!mined) {
            console.log(`${formatTime()}: not mined`, seed.toString(16).slice(0, 4), i++, success, Math.floor((Date.now() - start) / 1000))
        }
        if (mined) {
            const [newSeed] = await getPowInfo(liteClient, Address.parse(giverAddress))
            if (newSeed !== seed) {
                console.log('Mined already too late seed')
                continue
            }

            console.log(`${formatTime()}:     mined`, seed.toString(16).slice(0, 4), i++, ++success, Math.floor((Date.now() - start) / 1000))
            let seqno = 0

            if (liteClient instanceof LiteClient || liteClient instanceof TonClient4) {
                let w = liteClient.open(wallet)
                try {
                    seqno = await CallForSuccess(() => w.getSeqno())
                } catch (e) {
                    //
                }
            } else {
                const res = await CallForSuccess(
                    () => (liteClient as Api<unknown>).blockchain.execGetMethodForBlockchainAccount(wallet.address.toRawString(), "seqno", {}),
                    50,
                    250
                )
                if (res.success) {
                    seqno = Number(BigInt(res.stack[0].num as string))
                }
            }
            await sendMinedBoc(wallet, seqno, keyPair, giverAddress, Cell.fromBoc(mined as Buffer)[0].asSlice().loadRef())
        }
    }
}
main()

async function sendMinedBoc(
    wallet: WalletContractV4,
    seqno: number,
    keyPair: KeyPair,
    giverAddress: string,
    boc: Cell
) {
    if (args['--api'] === 'tonapi') {
        const tonapiClient = await getTonapiClient()

        const transfer = wallet.createTransfer({
            seqno,
            secretKey: keyPair.secretKey,
            messages: [internal({
                to: giverAddress,
                value: toNano('0.05'),
                bounce: true,
                body: boc,
            })],
            sendMode: 3 as any,
        })
        const msg = beginCell().store(storeMessage(external({
            to: wallet.address,
            body: transfer
        }))).endCell()

        let k = 0
        let lastError: unknown

        while (k < 20) {
            try {
                await tonapiClient.blockchain.sendBlockchainMessage({
                    boc: msg.toBoc().toString('base64'),
                })
                break
                // return res
            } catch (e: any) {
                // lastError = err
                k++

                if (e.status === 429) {
                    await delay(200)
                } else {
                    // console.log('tonapi error')
                    k = 20
                    break
                }

            }
        }
        return
    }

    const wallets: OpenedContract<WalletContractV4>[] = []
    const ton4Client = await getTon4Client()
    const tonOrbsClient = await getTon4Client()
    const w2 = ton4Client.open(wallet)
    const w3 = tonOrbsClient.open(wallet)
    wallets.push(w2)
    wallets.push(w3)

    if (args['--api'] === 'lite') {
        const liteServerClient = await getLiteClient(args['-c'] ?? 'https://ton-blockchain.github.io/global.config.json')
        const w1 = liteServerClient.open(wallet)
        wallets.push(w1)
    }

    for (let i = 0; i < 3; i++) {
        for (const w of wallets) {
            w.sendTransfer({
                seqno,
                secretKey: keyPair.secretKey,
                messages: [internal({
                    to: giverAddress,
                    value: toNano('0.05'),
                    bounce: true,
                    body: boc,
                })],
                sendMode: 3 as any,
            }).catch(e => {
                //
            })
        }
    }
}

async function testMiner(): Promise<boolean> {
    const randomName = (await getSecureRandomBytes(8)).toString('hex') + '.boc'
    const path = `bocs/${randomName}`
    const command = `${bin} -g ${gpu} -F 128 -t ${timeout} kQBWkNKqzCAwA9vjMwRmg7aY75Rf8lByPA9zKXoqGkHi8SM7 229760179690128740373110445116482216837 53919893334301279589334030174039261347274288845081144962207220498400000000000 10000000000 kQBWkNKqzCAwA9vjMwRmg7aY75Rf8lByPA9zKXoqGkHi8SM7 ${path}`
    try {
        const output = execSync(command, { encoding: 'utf-8', stdio: "pipe" });  // the default is 'buffer'
    } catch (e) {
    }
    let mined: Buffer | undefined = undefined
    try {
        mined = fs.readFileSync(path)
        fs.rmSync(path)
    } catch (e) {
        //
    }
    if (!mined) {
        return false
    }

    return true
}


// Function to call ton api untill we get response.
// Because testnet is pretty unstable we need to make sure response is final
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function CallForSuccess<T extends (...args: any[]) => any>(
    toCall: T,
    attempts = 20,
    delayMs = 100
): Promise<ReturnType<T>> {
    if (typeof toCall !== 'function') {
        throw new Error('unknown input')
    }

    let i = 0
    let lastError: unknown

    while (i < attempts) {
        try {
            const res = await toCall()
            return res
        } catch (err) {
            lastError = err
            i++
            await delay(delayMs)
        }
    }

    console.log('error after attempts', i)
    throw lastError
}

export function delay(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

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
