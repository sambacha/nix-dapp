import joinUrl from "url-join"

const { REACT_APP_NIX_API_BASE } = process.env

const NIX_API_CONFIG_PATH = "config"
const NIX_API_ACCOUNTS_PATH = "accounts"

export interface Tokens {
  request: Request
  status: string
  result: TokensResult
  error: Error | null
}

export interface Error {
  errorType: string
  code: number
  message: string
}

export interface Request {
  network: string
  apiVersion: string
  resource: string
  args: {}
  timestamp: string
}

export interface TokensResult {
  pagination: Pagination
  list: Token[]
}

export interface Token {
  id: number
  address: string
  symbol: string
  decimals: number
  enabledForFees: boolean
}

export interface Pagination {
  from: number
  limit: number
  direction: string
  count: number
}

export interface Config {
  request: Request
  status: string
  result: ConfigResult
  error: Error | null
}

export interface ConfigResult {
  network: string
  contract: string
  govContract: string
  depositConfirmations: number
  NIXVersion: string
}

export interface Account {
  request: Request
  status: string
  result: AccountResult
  error: Error | null
}

export interface AccountResult {
  accountId: number
  address: string
  nonce: number
  pubKeyHash: string
  lastUpdateInBlock: number
  balances: { [token: string]: number }
  accountType: string
  nfts: {}
  mintedNfts: {}
}

const getSyncApiTokensEndpoint = (from: number, limit: number): string =>
  joinUrl(
    REACT_APP_NIX_API_BASE,
    `tokens?limit=${limit}&from=${from}&direction=newer`,
  )

const NftApiConfigEndpoint = joinUrl(
  REACT_APP_NIX_API_BASE,
  NIX_API_CONFIG_PATH,
)
const getNftApiAccountEndpoint = (
  accountIdOrAddress: string,
  stateType: "maker" | "finalized" = "maker",
): string =>
  joinUrl(
    REACT_APP_NIX_API_BASE,
    NIX_API_ACCOUNTS_PATH,
    accountIdOrAddress,
    stateType,
  )

const LIMIT = 100
export const fetchTokenList = async (): Promise<Token[]> => {
  const response = await fetch(getSyncApiTokensEndpoint(0, LIMIT))
  const initialRes = (await response.json()) as Tokens

  if (!initialRes?.result?.pagination?.count)
    throw Error("No response included")

  const pages = Math.ceil(initialRes.result.pagination.count / LIMIT) - 1

  const allResults = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      fetch(getSyncApiTokensEndpoint((i + 1) * LIMIT, LIMIT)).then(
        (res) => res.json() as Promise<Tokens>,
      ),
    ),
  )

  const allToken = allResults.reduce(
    (acc, curr) => {
      if (!curr?.result?.list) throw Error("No response included")
      return [...acc, ...curr.result.list]
    },
    [...initialRes.result.list],
  )

  return allToken?.sort?.((a, b) => a.id - b.id)
}

export const fetchConfig = async (): Promise<ConfigResult> => {
  const response = await fetch(NftApiConfigEndpoint)
  const config = (await response.json()) as Config

  if (!config?.result) throw Error("No response included")

  return config.result
}

export const fetchAccount = async (
  accountIdOrAddress: string,
  stateType: "maker" | "finalized" = "maker",
): Promise<AccountResult> => {
  const response = await fetch(
    getNftApiAccountEndpoint(accountIdOrAddress, stateType),
  )
  const account = (await response.json()) as Account

  if (!account?.result) throw Error("No response included")

  return account.result
}
