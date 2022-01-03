/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IERC165, IERC165Interface } from "../IERC165";

const _abi = ["function supportsInterface(bytes4) view returns (bool)"];

export class IERC165__factory {
  static readonly abi = _abi;
  static createInterface(): IERC165Interface {
    return new utils.Interface(_abi) as IERC165Interface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IERC165 {
    return new Contract(address, _abi, signerOrProvider) as IERC165;
  }
}
