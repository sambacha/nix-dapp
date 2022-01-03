/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  IERC721Partial,
  IERC721PartialInterface,
} from "../IERC721Partial";

const _abi = [
  "function balanceOf(address) view returns (uint256)",
  "function isApprovedForAll(address,address) view returns (bool)",
  "function ownerOf(uint256) view returns (address)",
  "function safeTransferFrom(address,address,uint256) payable",
  "function supportsInterface(bytes4) view returns (bool)",
];

export class IERC721Partial__factory {
  static readonly abi = _abi;
  static createInterface(): IERC721PartialInterface {
    return new utils.Interface(_abi) as IERC721PartialInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IERC721Partial {
    return new Contract(address, _abi, signerOrProvider) as IERC721Partial;
  }
}
