import { Address, Cell, TupleReader, internal, parseTuple, toNano } from '@ton/core'
import { getSecureRandomBytes, keyPairFromSeed, mnemonicToWalletKey } from '@ton/crypto'
import axios from 'axios'
// import { LiteClient, LiteRoundRobinEngine, LiteSingleEngine } from 'ton-lite-client'
import { TonClient4 } from '@ton/ton';
import { execSync } from 'child_process';
import fs from 'fs'
import { WalletContractV4 } from '@ton/ton';
import dotenv from 'dotenv'
import { givers10000, givers100, givers1000 } from './givers'
import arg from 'arg'

dotenv.config({ path: 'config.txt.txt' })
dotenv.config({ path: '.env.txt' })
dotenv.config()
dotenv.config({ path: 'config.txt' })

const args = arg({
  '--givers': Number,
})


let givers = givers10000
if (args['--givers']) {
  const val = args['--givers']
  const allowed = [100, 1000, 10000]
  if (!allowed.includes(val)) {
    throw new Error('Invalid --givers argument')
  }

  switch (val) {
    case 100:
      givers = givers100
      break
    case 1000:
      givers = givers1000
      break
    case 10000:
      givers = givers10000
      break
  }
}

const mySeed = process.env.SEED as string
const totalDiff = BigInt('115792089237277217110272752943501742914102634520085823245724998868298727686144')

let lc: TonClient4 | undefined = undefined
let createLiteClient: Promise<void>

let bestGiver: { address: string, coins: number } = { address: '', coins: 0 }
async function updateBestGivers(liteClient: TonClient4) {
  const lastInfo = await CallForSuccess(() => liteClient.getLastBlock())

  let newBestGiber: { address: string, coins: number } = { address: '', coins: 0 }
  await Promise.all(givers.map(async (giver) => {
    const stack = await CallForSuccess(() => liteClient.runMethod(lastInfo.last.seqno, Address.parse(giver.address), 'get_pow_params', []))
    // const powStack = Cell.fromBase64(powInfo.result as string)
    // const stack = parseTuple(powStack)


    const reader = new TupleReader(stack.result)
    const seed = reader.readBigNumber()
    const complexity = reader.readBigNumber()
    const iterations = reader.readBigNumber()

    const hashes = totalDiff / complexity
    const coinsPerHash = giver.reward / Number(hashes)
    if (coinsPerHash > newBestGiber.coins) {
      newBestGiber = { address: giver.address, coins: coinsPerHash }
    }
  }))
  bestGiver = newBestGiber
}

let go = true
let i = 0
async function main() {
  const keyPair = await mnemonicToWalletKey(mySeed.split(' '))
  const liteClient = await getClient()

  const wallet = WalletContractV4.create({
    workchain: 0,
    publicKey: keyPair.publicKey
  })
  const opened = liteClient.open(wallet)

  await updateBestGivers(liteClient)

  setInterval(() => {
    updateBestGivers(liteClient)
  }, 1000)

  while (go) {
    const giverAddress = bestGiver.address
    const lastInfo = await CallForSuccess(() => liteClient.getLastBlock())
    const powInfo = await CallForSuccess(() => liteClient.runMethod(lastInfo.last.seqno, Address.parse(giverAddress), 'get_pow_params', []))
    // const powStack = Cell.fromBase64(powInfo.result as string)
    // const stack = parseTuple(powStack)

    const reader = new TupleReader(powInfo.result)
    const seed = reader.readBigNumber()
    const complexity = reader.readBigNumber()
    const iterations = reader.readBigNumber()

    const randomName = (await getSecureRandomBytes(8)).toString('hex') + '.boc'
    const path = `bocs/${randomName}`
    const command = `.\\pow-miner-cuda.exe -g 0 -F 128 -t 5 ${wallet.address.toString({ urlSafe: true, bounceable: true })} ${seed} ${complexity} ${iterations} ${giverAddress} ${path}`
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
      console.log(`${new Date()}: not mined`, seed, i++)
    }
    if (mined) {

      const lastInfo = await CallForSuccess(() => liteClient.getLastBlock())
      const powInfo = await CallForSuccess(() => liteClient.runMethod(lastInfo.last.seqno, Address.parse(giverAddress), 'get_pow_params', []))
      // const powStack = Cell.fromBase64(powInfo.result as string)
      // const stack = parseTuple(powStack)

      const reader = new TupleReader(powInfo.result)
      const newSeed = reader.readBigNumber()
      if (newSeed !== seed) {
        console.log('Mined already too late seed')
        continue
      }

      console.log(`${new Date()}:     mined`, seed, i++)

      let seqno = 0
      try {
        seqno = await CallForSuccess(() => opened.getSeqno())
      } catch (e) {
        //
      }
      for (let j = 0; j < 5; j++) {
        try {
          await CallForSuccess(() => {
            return opened.sendTransfer({
              seqno,
              secretKey: keyPair.secretKey,
              messages: [internal({
                to: giverAddress,
                value: toNano('0.05'),
                bounce: true,
                body: Cell.fromBoc(mined as Buffer)[0].asSlice().loadRef(),
              })],
              sendMode: 3 as any,
            })
          })
          break
        } catch (e) {
          if (j === 4) {
            throw e
          }
          //
        }
      }
    }
  }
}
main()


export function intToIP(int: number) {
  const part1 = int & 255
  const part2 = (int >> 8) & 255
  const part3 = (int >> 16) & 255
  const part4 = (int >> 24) & 255

  return `${part4}.${part3}.${part2}.${part1}`
}



export async function getClient(_configUrl?: string): Promise<TonClient4> {
  if (lc) {
    return lc
  }

  lc = new TonClient4({ endpoint: _configUrl ?? 'https://mainnet-v4.tonhubapi.com' })
  return lc as TonClient4
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
