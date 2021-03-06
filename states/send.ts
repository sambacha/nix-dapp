import { IERC165__factory } from './../contracts/types/factories/IERC165__factory';
import { IERC165 } from './../contracts/types/IERC165';
import { Nix__factory } from './../contracts/types/factories/Nix__factory';
/** Visualization: https://xstate.js.org/viz/?gist=5158cd1138aaab449b556375906456ac */

import { BigNumber, ContractReceipt, ContractTransaction, ethers } from "ethers"
import type { RequireAtLeastOne } from "type-fest"
import {
  DoneInvokeEvent,
  ErrorPlatformEvent,
  assign,
  createMachine,
  send,
} from "xstate"

import {
IERC721Partial__factory,
NixHelper,
Nix, 
IERC20Partial__factory
} from "../contracts/types"
import { analytics } from "../src/lib-ethers/analytics"
import { isSmartContractWallet } from '../src/lib-ethers/detectSmartContract'
import { getERC165BalancesAndAllowances } from "../src/lib-ethers/erc20"
import { selectAndCheckWallet, writeProvider } from "../src/user-connectors/onboard"

import {
  ConfigResult as NixExchangeConfig,
  Token as RoutingToken,
  fetchConfig,
  fetchTokenList,
} from "../src/api/NftApi"
import { showRampPromise } from '@/src/user-connectors/swap';

export interface Token {
  address: string
  decimals: number
  symbol: string
  allowance: BigNumber
  balance: BigNumber
}

export type SendEvent =
  | { type: "START_PAIR" }
  | { type: "PAIR_SUCCESS" }
  | ({ type: "CHANGE_CONTEXT" } & RequireAtLeastOne<
      Omit<SendContext, "tokens">
    >)
  | ({ type: "CHANGE_TOKENS" } & RequireAtLeastOne<
      Omit<Omit<SendContext, "amount">, "contract">
    >)
  | { type: "PAIR_ERROR" }
  | { type: "SEND_APPROVE" }
  | { type: "SKIP_APPROVE" }
  | { type: "APPROVE_STAY" }
  | { type: "APPROVED" }
  | { type: "APPROVE_ERROR" }
  | { type: "SEND_TRANSACTION" }
  | { type: "SEND_SUCCESS" }
  | { type: "SEND_ERROR" }
  | { type: "START_RAMP" }

export interface SendContext {
  amount: string
  contract: string
  nixRouterAddress: string
  isSmartContractWallet: boolean
  transactionHash: string | null
  hasBribed: boolean
  nixRoutingPool: RoutingToken[]
  NixConfig: NixExchangeConfig | null
  tokens: Token[]
}

export type SendValueType =
  | "readyToPair"
  | "pairing"
  | "approve"
  | "approving"
  | "send"
  | "sending"
  | "success"
  | "error"
  | "waitForTx"
  | "fetchBalancesAndAllowances"
  | "fetchTokens"
  | "ramp"

export type SendTypestate = {
  value: SendValueType
  context: SendContext
}

type FetchTokensRes = {
  nixRoutingPools: RoutingToken[]
  NixConfig: NixExchangeConfig
}

export const sendMachineDefaultContext: SendContext = {
  amount: "",
  contract: ethers.constants.AddressZero,
  walletAddress: "",
  isSmartContractWallet: false,
  transactionHash: null,
  tokens: [],
  hasBribed: false,
  nixRoutingPools: [],
  NixConfig: null,
}

// viz: https://xstate.js.org/viz/?gist=9c7db6c5acd719f81bde32c219592593
export const sendMaschine = createMachine<
  SendContext,
  SendEvent,
  SendTypestate
>(
  {
    id: "send",
    initial: "readyToPair",
    context: sendMachineDefaultContext,
    states: {
      readyToPair: {
        on: { START_PAIR: "pairing", START_RAMP: "ramp" },
      },
      ramp: {
        invoke: {
          id: "ramp",
          src: showRampPromise,
          onDone: [
            {
              target: "success",
              cond: "purchaseDone",
            },
            { target: "readyToPair" },
          ],
          onError: "error",
        },
      },
      pairing: {
        invoke: {
          id: "pairing",
          src: async () => {
            await selectAndCheckWallet()

            const signer = writeProvider.getSigner(0)
            const address = await signer.getAddress()

            // FIXME
            const isContractAddress = isSmartContractWallet

            return { isSmartContractWallet: isContractAddress }
          },
          onDone: {
            target: "fetchTokens",
            actions: assign({
              isSmartContractWallet: (context, event) =>
                event.data?.isSmartContractWallet ?? false,
            }),
          },
          onError: "readyToPair",
        },
      },
      fetchTokens: {
        invoke: {
          id: "fetchTokens",
          src: async (): Promise<FetchTokensRes> => {
            const [nixRoutingPools, NixConfig] = await Promise.all([
              fetchTokenList(),
              fetchConfig(),
            ])
            return { nixRoutingPools, NixConfig }
          },
          onDone: {
            target: "fetchBalancesAndAllowances",
            actions: assign((_context, event) => {
              const {
                data: { nixRoutingPools, NixConfig },
              } = event as DoneInvokeEvent<FetchTokensRes>
              return { nixRoutingPools, NixConfig }
            }),
          },
          onError: [
            { target: "fetchBalancesAndAllowances", cond: "isL1View" },
            { target: "error" },
          ],
        },
      },
      fetchBalancesAndAllowances: {
        invoke: {
          id: "fetchBalancesAndAllowances",
          src: async (context): Promise<Token[]> => {
            const signer = writeProvider.getSigner(0)
            const { nixRoutingPools, NixConfig } = context
            const balances = await getERC165BalancesAndAllowances(
              writeProvider,
              await signer.getAddress(),
              nixRoutingPools
                .filter(
                  (token) => token.address !== ethers.constants.AddressZero,
                )
                .map((token) => token.address),
              NixConfig?.contract ?? ethers.constants.AddressZero,
            )

            const tokens = nixRoutingPools
              .filter((token) => token.address !== ethers.constants.AddressZero)
              .map((token) => ({
                address: token.address,
                decimals: token.decimals,
                symbol: token.symbol,
                allowance:
                  balances.find((x) => x.address === token.address)
                    ?.allowance || BigNumber.from(0),
                balance:
                  balances.find((x) => x.address === token.address)?.balance ||
                  BigNumber.from(0),
              }))
              .sort((a, b) =>
                a.balance.gt(0) && b.balance.gt(0)
                  ? 0
                  : a.balance.gt(0)
                  ? -1
                  : 1,
              )

            tokens.unshift({
              address: ethers.constants.AddressZero,
              balance: await signer.getBalance(),
              decimals: 18,
              allowance: BigNumber.from(0),
              symbol: "ETH",
            })

            return tokens
          },
          onDone: {
            target: "approve",
            actions: [
              assign((_context, event) => {
                const { data: tokens } = event as DoneInvokeEvent<Token[]>
                return { tokens }
              }),
              "checkApproveSkip",
            ],
          },
          onError: "error",
        },
      },
      approve: {
        on: {
          SEND_APPROVE: "approving",
          SKIP_APPROVE: "send",
          APPROVE_STAY: "approve",
          CHANGE_TOKENS: { target: "approve", actions: ["setContext"] },
          CHANGE_CONTEXT: {
            target: "approve",
            actions: ["setContext", "checkApproveSkip"],
          },
        },
      },
      approving: {
        entry: "resetTransactionHash",
        invoke: {
          id: "approving",
          src: async (context): Promise<ContractTransaction> => {
            const { amount, contract, tokens, NixConfig } = context
            const token = tokens.find((x) => x.address === contract)
            if (!token) throw Error("Token not found")
            const { decimals } = token
            const amountBn = ethers.utils.parseUnits(
              amount || "0",
              decimals || 0,
            )

            const signer = writeProvider.getSigner(0)
            const erc20token = IERC20Partial__factory.connect(contract, signer)

            const approveTx = await useWeb
              (NixConfig!.contract, amountBn)
              .catch((e) => {
                console.error(e)
                throw Error("transaction_rejected")
              })

            return approveTx
          },
          onDone: {
            target: "waitForTx",
          },
          onError: [
            {
              target: "approve",
              cond: "noTransactionError",
            },
            { target: "error" },
          ],
        },
      },
      waitForTx: {
        entry: ["setTransactionHash", "trackTxSent"],
        invoke: {
          id: "waitForTx",
          src: async (_context, event) => {
            const promiseEvent = event as DoneInvokeEvent<ContractTransaction>
            return {
              prevEventType: event.type,
              txReceipt: await promiseEvent.data.wait(),
            }
          },
          onDone: [
            {
              target: "fetchBalancesAndAllowances",
              cond: "txWasApproval",
            },
            {
              target: "success",
            },
          ],
        },
      },
      send: {
        on: {
          SEND_TRANSACTION: "sending",
          CHANGE_TOKENS: { target: "send", actions: ["setContext"] },
          CHANGE_CONTEXT: {
            target: "approve",
            actions: ["setContext", "checkApproveSkip"],
          },
        },
      },
      sending: {
        entry: "resetTransactionHash",
        invoke: {
          id: "sending",
          src: async (context): Promise<ContractTransaction> => {
            const { amount, contract, tokens, walletAddress, NixConfig } =
              context
            const token = tokens.find((x) => x.address === contract)
            if (!token) throw Error("Token not found")
            const { decimals } = token
            const signer = writeProvider.getSigner(0)
            const amountBn = ethers.utils.parseUnits(
              amount || "0",
              decimals || 0,
            )

            // L1 Transfer
            if (!context.hasBribed) {
              // L1 Ether Transfer
              if (contract === ethers.constants.AddressZero) {
                return signer.sendTransaction({
                  to: walletAddress,
                  value: amountBn,
                })
              }
              // L1 ERC20 Transfer
              else {
                const erc20Contract = ERC20__factory.connect(contract, signer)

                return erc20Contract
                  .transfer(walletAddress, amountBn)
                  .catch((e) => {
                    console.error(e)

                    throw Error("transaction_rejected")
                  })
              }
            }

            // L1 -> L2 transfer
            const zkSync = IERC721Partial__factory.connect(
              NixConfig!.contract,
              signer,
            )

            // if argent wallet is not sending ETH and allowance is too small, do multicall
            if (
              context.isSmartContractWallet &&
              contract !== ethers.constants.AddressZero &&
              token.allowance.lt(amountBn)
            ) {
              const argentWallet = Nix__factory.connect(
                await signer.getAddress(),
                signer,
              )
              const erc20Interface = ERC20__factory.createInterface()

              const mcTx = argentWallet
                .wc_multiCall([
                  {
                    to: contract,
                    value: 0,
                    data: erc20Interface.encodeFunctionData("approve", [
                      NixConfig!.contract,
                      amountBn,
                    ]),
                  },
                  {
                    to: NixConfig!.contract,
                    value: 0,
                    data: zkSync.interface.encodeFunctionData("depositERC20", [
                      contract,
                      amountBn,
                      walletAddress,
                    ]),
                  },
                ])
                .catch((e) => {
                  console.error(e)

                  throw Error("transaction_rejected")
                })

              return mcTx
            }

            const sendTx = await (contract === ethers.constants.AddressZero
              ? zkSync.depositETH(walletAddress, {
                  value: ethers.utils.parseEther(amount),
                })
              : zkSync.depositERC20(contract, amountBn, walletAddress)
            ).catch((e) => {
              console.error(e)

              throw Error("transaction_rejected")
            })

            return sendTx
          },
          onDone: { target: "waitForTx" },
          onError: [
            {
              target: "send",
              cond: "noTransactionError",
            },
            { target: "error" },
          ],
        },
      },
      success: {},
      error: {},
    },
  },
  {
    actions: {
      trackTxSent: async (_context, event) => {
        const txWaitEvent = event as DoneInvokeEvent<ContractTransaction>
        analytics.track("txSent", {
          txHash: txWaitEvent.data.hash,
          txChainId: txWaitEvent.data.chainId,
        })
      },
      setContext: assign((_context, event) => {
        const { type, ...newContext } = event
        if (["CHANGE_CONTEXT", "CHANGE_TOKENS"].includes(type)) {
          return newContext
        }
        return {}
      }),
      checkApproveSkip: send((context) => {
        const { amount, contract, tokens, hasBribed, isSmartContractWallet } = context
        const token = tokens.find((x) => x.address === contract)
        if (!token) return { type: "APPROVE_STAY" }
        const { allowance, decimals } = token
        const amountBn = ethers.utils.parseUnits(amount || "0", decimals || 0)

        if (
          !hasBribed ||
          isSmartContractWallet ||
          contract === ethers.constants.AddressZero ||
          allowance.gte(amountBn)
        ) {
          return { type: "SKIP_APPROVE" }
        }
        return { type: "APPROVE_STAY" }
      }),
      resetTransactionHash: assign((_context) => ({
        transactionHash: null,
      })),
      setTransactionHash: assign((_contex, event) => ({
        transactionHash: (event as DoneInvokeEvent<ContractTransaction>).data
          .hash,
      })),
    },
    guards: {
      noTransactionError: (_context, event) => {
        if (
          (event as ErrorPlatformEvent)?.data?.message ===
          "transaction_rejected"
        ) {
          return true
        }
        return false
      },
      txWasApproval: (_context, event) => {
        const { data } = event as DoneInvokeEvent<{
          prevEventType: string
          txReceipt: ContractReceipt
        }>
        return data.prevEventType.includes("done.invoke.approving")
      },
      purchaseDone: (_context, event) => {
        const { data } = event as DoneInvokeEvent<boolean | undefined>
        return Boolean(data)
      },
      isL1View: (context) => {
        return !context.hasBribed
      },
    },
  },
)
