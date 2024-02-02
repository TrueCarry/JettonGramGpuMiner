import { Address, Cell, TupleReader, internal, parseTuple, toNano } from '@ton/core'
import { getSecureRandomBytes, keyPairFromSeed, mnemonicToWalletKey } from '@ton/crypto'
import axios from 'axios'
import { LiteClient, LiteRoundRobinEngine, LiteSingleEngine } from 'ton-lite-client'
import { execSync } from 'child_process';
import fs from 'fs'
import { WalletContractV4 } from '@ton/ton';
import dotenv from 'dotenv'
import { HighloadWalletV2 } from "@scaleton/highload-wallet";
import { givers100 } from './givers';


dotenv.config({ path: 'config.txt.txt' })
dotenv.config({ path: '.env.txt' })
dotenv.config()
dotenv.config({ path: 'config.txt' })

const mySeed = process.env.SEED as string
const totalDiff = BigInt('115792089237277217110272752943501742914102634520085823245724998868298727686144')


const givers = givers100
// const givers = [
//   // { address: 'EQDSGvoktoIRTL6fBEK_ysS8YvLoq3cqW2TxB_xHviL33ex2', reward: 1000 },
//   // { address: 'EQCvMmHhSYStEtUAEDrpV39T2GWl-0K-iqCxSSZ7I96L4yow', reward: 1000 },
//   // { address: 'EQBvumwjKe7xlrjc22p2eLGT4UkdRnrmqmcEYT94J6ZCINmt', reward: 1000 },
//   // { address: 'EQDEume45yzDIdSy_Cdz7KIKZk0HyCFIr0yKdbtMyPfFUkbl', reward: 1000 },
//   // { address: 'EQAO7jXcX-fJJZl-kphbpdhbIDUqcAiYcAr9RvVlFl38Uatt', reward: 1000 },
//   // { address: 'EQAvheS_G-U57CE55UlwF-3M-cc4cljbLireYCmAMe_RHWGF', reward: 1000 },
//   // { address: 'EQCba5q9VoYGgiGykVazOUZ49UK-1RljUeZgU6E-bW0bqF2Z', reward: 1000 },
//   // { address: 'EQCzT8Pk1Z_aMpNukdV-Mqwc6LNaCNDt-HD6PiaSuEeCD0hV', reward: 1000 },
//   // { address: 'EQDglg3hI89dySlr-FR_d1GQCMirkLZH6TPF-NeojP-DbSgY', reward: 1000 },
//   // { address: 'EQDIDs45shbXRwhnXoFZg303PkG2CihbVvQXw1k0_yVIqxcA', reward: 1000 }, // 1000

//   { address: 'EQD7VspHSNS4VSpN7QQicNgSYoJ68CmdC6oL5ZEKHSXe26Sa', reward: 10000 },
//   { address: 'EQC5uEgW0MkTbCRBZB72maxCZT3m14OK2FcSLVr2H_7MTTSF', reward: 10000 },
//   { address: 'EQC2nD9nQNRhcfWhdBzRK-wdlTO4hGxnPFzdSxKN777tab2_', reward: 10000 },
//   { address: 'EQAqd4vV0O5oGfA7bl6fVORD_Y4PTNZG82AC2BObBux51g2w', reward: 10000 },
//   { address: 'EQDcOxqaWgEhN_j6Tc4iIQNCj2dBf9AFm0S9QyouwifYo9KD', reward: 10000 },
//   { address: 'EQAjYs4-QKve9gtwC_HrKNR0Eaqhze4sKUmRhRYeensX8iu3', reward: 10000 },
//   { address: 'EQBGhm8bNil8tw4Z2Ekk4sKD-vV-LCz7BW_qIYCEjZpiMF6Q', reward: 10000 },
//   { address: 'EQCtrloCD9BHbVT7q8aXkh-JtL_ZDvtJ5Y-eF2ahg1Ru1EUl', reward: 10000 },
//   { address: 'EQCWMIUBrpwl7OeyEQsOF9-ZMKCQ7fh3_UOvM2N5y77u8uPc', reward: 10000 },
//   { address: 'EQD_71XLqY8nVSf4i5pqGsCjz6EUo2kQEEQq0LUAgg6AHolO', reward: 10000 }, // 10 000

//   // { address: 'EQDUIeTNcRUqsz4bugyWl4q4vg16PN2EwiyyAIEbf7_WJZZH', reward: 100000 },
//   // { address: 'EQC4qKAIM0Od4RFG-4MAY0dJ3j4Wrcs0jc1XeWKJURYB9KSz', reward: 100000 },
//   // { address: 'EQC0Ssi1gl0IQKEGsCp91NeiTThdMqCzYvlX9sVLEU97rWqL', reward: 100000 },
//   // { address: 'EQDO2_2zkIJPqBKeE_P1VvDYOJi1vGPgiKo0Aa6Z-bY7BeuG', reward: 100000 },
//   // { address: 'EQADEy4zcVl-ADNMISdYSs5cVjJcHmwC9_phXXjqNKgME7j6', reward: 100000 },
//   // { address: 'EQDWELx3CYohD9sIjhyEIhP915kL_3XthqruCbmcB0YTWDqQ', reward: 100000 },
//   // { address: 'EQDdoh2hzGFHdQtiXJNPNrwA8yIGd4-sFxyuEr3z6JL5BIFi', reward: 100000 },
//   // { address: 'EQALXKp6G-IjWTPEqFKILkqcql-43DcoPzJ21Z02abpBPaQK', reward: 100000 },
//   // { address: 'EQBAHXFxs1ohHY2bzW9A-V0NDznkFlROkNF_oyppxlLfsyEJ', reward: 100000 },
//   // { address: 'EQCUwgBew9u4NwwuFsfPsXX9a69K55uFcieaHtc-c37OYDJO', reward: 100000 },
// ]

let lc: LiteClient | undefined = undefined
let createLiteClient: Promise<void>

let bestGiver: { address: string, coins: number } = { address: '', coins: 0 }
async function updateBestGivers(liteClient: LiteClient) {
  const lastInfo = await liteClient.getMasterchainInfo()

  let newBestGiber: { address: string, coins: number } = { address: '', coins: 0 }
  await Promise.all(givers.map(async (giver) => {
    const powInfo = await liteClient.runMethod(Address.parse(giver.address), 'get_pow_params', Buffer.from([]), lastInfo.last)
    const powStack = Cell.fromBase64(powInfo.result as string)
    const stack = parseTuple(powStack)


    const reader = new TupleReader(stack)
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
  const liteClient = await getLiteClient('https://tondiamonds.fra1.cdn.digitaloceanspaces.com/config-tonvision-liteserver.json')

  const wallet = new HighloadWalletV2(keyPair.publicKey)
  const opened = liteClient.open(wallet)
  console.log('Got wallet', wallet.address.toString({urlSafe: true, bounceable: false}))
  const walletState = await liteClient.getAccountState(wallet.address, (await liteClient.getMasterchainInfo()).last)
  if (walletState.balance.coins < toNano('0.1')) {
    throw new Error('No balance on wallet')
  }

  await updateBestGivers(liteClient)

  setInterval(() => {
    updateBestGivers(liteClient)
  }, 1000)

  while (go) {
    const lastInfo = await liteClient.getMasterchainInfo()
    const powInfo = await liteClient.runMethod(Address.parse(bestGiver.address), 'get_pow_params', Buffer.from([]), lastInfo.last)
    const powStack = Cell.fromBase64(powInfo.result as string)
    const stack = parseTuple(powStack)

    const reader = new TupleReader(stack)
    const seed = reader.readBigNumber()
    const complexity = reader.readBigNumber()
    const iterations = reader.readBigNumber()

    const randomName = (await getSecureRandomBytes(8)).toString('hex') + '.boc'
    const path = `bocs/${randomName}`
    const command = `.\\pow-miner-cuda.exe -g 0 -F 128 -t 5 ${wallet.address.toString({ urlSafe: true, bounceable: true })} ${seed} ${complexity} ${iterations} ${bestGiver.address} ${path}`
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
      console.log(`${new Date()}: not mined`, i++)
    }
    if (mined) {
      console.log(`${new Date()}:     mined`, i++)

      for (let j = 0; j < 5; j++) {
        try {
          const queryId = opened.generateQueryId(60)
          opened.sendTransfer({
            queryId: queryId,
            secretKey: keyPair.secretKey,
            messages: [[internal({
              to: bestGiver.address,
              value: toNano('0.05'),
              bounce: true,
              body: Cell.fromBoc(mined)[0].asSlice().loadRef(),
            }), 3 as any]],
          })
          break
        } catch (e) {
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



export async function getLiteClient(_configUrl): Promise<LiteClient> {
  if (lc) {
    return lc
  }

  if (!createLiteClient) {
    createLiteClient = (async () => {
      const { data } = await axios(_configUrl)

      const liteServers = data.liteservers
      const engines: any[] = []

      for (const server of liteServers) {
        const ls = server
        engines.push(
          new LiteSingleEngine({
            host: `tcp://${intToIP(ls.ip)}:${ls.port}`,
            publicKey: Buffer.from(ls.id.key, 'base64'),
          })
        )
      }

      const engine = new LiteRoundRobinEngine(engines)
      const lc2 = new LiteClient({
        engine,
        batchSize: 1,
      })
      lc = lc2
    })()
  }

  await createLiteClient

  return lc as any
}