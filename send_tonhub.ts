import { Address, Cell, TupleReader, internal, parseTuple, toNano } from '@ton/core'
import { getSecureRandomBytes, keyPairFromSeed, mnemonicToWalletKey } from '@ton/crypto'
import axios from 'axios'
// import { LiteClient, LiteRoundRobinEngine, LiteSingleEngine } from 'ton-lite-client'
import { TonClient4 } from '@ton/ton';
import { execSync } from 'child_process';
import fs from 'fs'
import { WalletContractV4 } from '@ton/ton';
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: 'config.txt' })

const mySeed = process.env.SEED as string
const totalDiff = BigInt('115792089237277217110272752943501742914102634520085823245724998868298727686144')

const givers = [
  { address: 'EQDSGvoktoIRTL6fBEK_ysS8YvLoq3cqW2TxB_xHviL33ex2', reward: 1000 },
  { address: 'EQCvMmHhSYStEtUAEDrpV39T2GWl-0K-iqCxSSZ7I96L4yow', reward: 1000 },
  { address: 'EQBvumwjKe7xlrjc22p2eLGT4UkdRnrmqmcEYT94J6ZCINmt', reward: 1000 },
  { address: 'EQDEume45yzDIdSy_Cdz7KIKZk0HyCFIr0yKdbtMyPfFUkbl', reward: 1000 },
  { address: 'EQAO7jXcX-fJJZl-kphbpdhbIDUqcAiYcAr9RvVlFl38Uatt', reward: 1000 },
  { address: 'EQAvheS_G-U57CE55UlwF-3M-cc4cljbLireYCmAMe_RHWGF', reward: 1000 },
  { address: 'EQCba5q9VoYGgiGykVazOUZ49UK-1RljUeZgU6E-bW0bqF2Z', reward: 1000 },
  { address: 'EQCzT8Pk1Z_aMpNukdV-Mqwc6LNaCNDt-HD6PiaSuEeCD0hV', reward: 1000 },
  { address: 'EQDglg3hI89dySlr-FR_d1GQCMirkLZH6TPF-NeojP-DbSgY', reward: 1000 },
  { address: 'EQDIDs45shbXRwhnXoFZg303PkG2CihbVvQXw1k0_yVIqxcA', reward: 1000 }, // 1000

  // { address: 'EQD7VspHSNS4VSpN7QQicNgSYoJ68CmdC6oL5ZEKHSXe26Sa', reward: 10000 },
  // { address: 'EQC5uEgW0MkTbCRBZB72maxCZT3m14OK2FcSLVr2H_7MTTSF', reward: 10000 },
  // { address: 'EQC2nD9nQNRhcfWhdBzRK-wdlTO4hGxnPFzdSxKN777tab2_', reward: 10000 },
  // { address: 'EQAqd4vV0O5oGfA7bl6fVORD_Y4PTNZG82AC2BObBux51g2w', reward: 10000 },
  // { address: 'EQDcOxqaWgEhN_j6Tc4iIQNCj2dBf9AFm0S9QyouwifYo9KD', reward: 10000 },
  // { address: 'EQAjYs4-QKve9gtwC_HrKNR0Eaqhze4sKUmRhRYeensX8iu3', reward: 10000 },
  // { address: 'EQBGhm8bNil8tw4Z2Ekk4sKD-vV-LCz7BW_qIYCEjZpiMF6Q', reward: 10000 },
  // { address: 'EQCtrloCD9BHbVT7q8aXkh-JtL_ZDvtJ5Y-eF2ahg1Ru1EUl', reward: 10000 },
  // { address: 'EQCWMIUBrpwl7OeyEQsOF9-ZMKCQ7fh3_UOvM2N5y77u8uPc', reward: 10000 },
  // { address: 'EQD_71XLqY8nVSf4i5pqGsCjz6EUo2kQEEQq0LUAgg6AHolO', reward: 10000 }, // 10 000

  // { address: 'EQDUIeTNcRUqsz4bugyWl4q4vg16PN2EwiyyAIEbf7_WJZZH', reward: 100000 },
  // { address: 'EQC4qKAIM0Od4RFG-4MAY0dJ3j4Wrcs0jc1XeWKJURYB9KSz', reward: 100000 },
  // { address: 'EQC0Ssi1gl0IQKEGsCp91NeiTThdMqCzYvlX9sVLEU97rWqL', reward: 100000 },
  // { address: 'EQDO2_2zkIJPqBKeE_P1VvDYOJi1vGPgiKo0Aa6Z-bY7BeuG', reward: 100000 },
  // { address: 'EQADEy4zcVl-ADNMISdYSs5cVjJcHmwC9_phXXjqNKgME7j6', reward: 100000 },
  // { address: 'EQDWELx3CYohD9sIjhyEIhP915kL_3XthqruCbmcB0YTWDqQ', reward: 100000 },
  // { address: 'EQDdoh2hzGFHdQtiXJNPNrwA8yIGd4-sFxyuEr3z6JL5BIFi', reward: 100000 },
  // { address: 'EQALXKp6G-IjWTPEqFKILkqcql-43DcoPzJ21Z02abpBPaQK', reward: 100000 },
  // { address: 'EQBAHXFxs1ohHY2bzW9A-V0NDznkFlROkNF_oyppxlLfsyEJ', reward: 100000 },
  // { address: 'EQCUwgBew9u4NwwuFsfPsXX9a69K55uFcieaHtc-c37OYDJO', reward: 100000 },
]

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
