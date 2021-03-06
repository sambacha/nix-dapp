/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  ERC721TokenReceiver,
  ERC721TokenReceiverInterface,
} from "../ERC721TokenReceiver";

const _abi = [
  "function onERC721Received(address,address,uint256,bytes) returns (bytes4)",
];

export class ERC721TokenReceiver__factory {
  static readonly abi = _abi;
  static createInterface(): ERC721TokenReceiverInterface {
    return new utils.Interface(_abi) as ERC721TokenReceiverInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ERC721TokenReceiver {
    return new Contract(address, _abi, signerOrProvider) as ERC721TokenReceiver;
  }
}
