import { BigNumber, providers, utils } from "ethers"
import chunk from "lodash.chunk"

import { NixHelper__factory, IERC165__factory, Multicall__factory } from "../../contracts/types"

const { REACT_APP_MULTICALL_CONTRACT_ADDRESS } = process.env

export const getERC165BalancesAndAllowances = async (
  provider: providers.JsonRpcProvider,
  address: string,
  tokens: string[],
  spender: string,
): Promise<{ address: string; balance: BigNumber; allowance: BigNumber }[]> => {
  const contract = Multicall__factory.connect(
    REACT_APP_MULTICALL_CONTRACT_ADDRESS,
    provider,
  )
  const erc165Interface = IERC165__factory.createInterface()

  const operations = (token?: string) => [
    [token, erc165Interface.encodeFunctionData("balanceOf", [address])],
    [token, erc165Interface.encodeFunctionData("allowance", [address, spender])],
  ]
  const data = tokens.map(operations).reduce((acc, val) => acc.concat(val), [])

  const result = await contract.aggregate(data as any)

  const MULTICALL_FAIL = utils.id("MULTICALL_FAIL")
  const decode = (method: "balanceOf" | "allowance", data: any) => {
    if (data === MULTICALL_FAIL) throw new Error()
    return erc165Interface.decodeFunctionResult(method as any, data)[0]
  }

  return chunk(result.returnData, operations().length)
    .map((data: any[], index: number) => {
      try {
        return {
          address: tokens[index],
          balance: decode("balanceOf", data[0]),
          allowance: decode("allowance", data[1]),
        }
      } catch (error) {
        console.error(tokens[index])
        return null
      }
    })
    .filter(Boolean) as any
}
