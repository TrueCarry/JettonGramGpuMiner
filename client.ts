import { TonClient, TonClient4 } from "@ton/ton"
import axios from "axios"
import { LiteClient, LiteSingleEngine, LiteRoundRobinEngine } from "ton-lite-client"
import { getHttpEndpoint, getHttpV4Endpoint } from "@orbs-network/ton-access";
import { HttpClient, Api } from 'tonapi-sdk-js';

let lc4: TonClient4 | undefined = undefined
let lc: LiteClient | undefined = undefined

let lcOrbs: TonClient4 | undefined = undefined
let lcHub: TonClient4 | undefined = undefined

let lcToncenter: TonClient | undefined = undefined

let tonapiClient: Api<unknown> | undefined = undefined

let createLiteClient: Promise<void>

export function intToIP(int: number) {
    const part1 = int & 255
    const part2 = (int >> 8) & 255
    const part3 = (int >> 16) & 255
    const part4 = (int >> 24) & 255

    return `${part4}.${part3}.${part2}.${part1}`
}

export async function getTon4Client(_configUrl?: string): Promise<TonClient4> {
    if (lc4) {
        return lc4
    }

    lc4 = new TonClient4({ endpoint: _configUrl ?? await getHttpV4Endpoint() })
    return lc4 as TonClient4
}

export async function getTon4ClientOrbs(_configUrl?: string): Promise<TonClient4> {
    if (lcOrbs) {
        return lcOrbs
    }

    lcOrbs = new TonClient4({ endpoint: _configUrl ?? await getHttpV4Endpoint() })
    return lcOrbs as TonClient4
}

export async function getTon4ClientTonhub(_configUrl?: string): Promise<TonClient4> {
    if (lcHub) {
        return lcHub
    }

    lcHub = new TonClient4({ endpoint: _configUrl ?? 'https://mainnet-v4.tonhubapi.com' })
    return lcHub as TonClient4
}

export async function getTonCenterClient(_configUrl?: string): Promise<TonClient> {
    if (lcToncenter) {
        return lcToncenter
    }

    lcToncenter = new TonClient({ endpoint: _configUrl ?? 'https://toncenter.com/api/v2/jsonRPC' })
    return lcToncenter as TonClient
}

export async function getLiteClient(_configUrl): Promise<LiteClient> {
    if (lc) {
        return lc
    }

    if (!createLiteClient) {
        createLiteClient = (async () => {
            const { data } = await axios(_configUrl)
            // const data = JSON.parse(fs.readFileSync('ton-global.config', {encoding: 'utf8'}))

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

export async function getTonapiClient(): Promise<Api<unknown>> {
    if (tonapiClient) {
        return tonapiClient
    }

    const headers = {
        'Content-type': 'application/json'
    }

    if (process.env.TONAPI_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.TONAPI_TOKEN}`
    }
    const httpClient = new HttpClient({
        baseUrl: 'https://tonapi.io',
        baseApiParams: {
            headers,
        }
    });
    
    // Initialize the API client
    const client = new Api(httpClient);
    tonapiClient = client
    return client
}