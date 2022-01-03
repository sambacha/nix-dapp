/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { Owned, OwnedInterface } from "../Owned";

const _abi = [
  "constructor()",
  "error NotOwner()",
  "event OwnershipTransferred(address indexed,address indexed)",
  "event Withdrawn(address indexed,uint256,uint256)",
  "function owner() view returns (address)",
  "function transferOwnership(address)",
  "function withdraw(address,uint256,uint256)",
];

export class Owned__factory {
  static readonly abi = _abi;
  static createInterface(): OwnedInterface {
    return new utils.Interface(_abi) as OwnedInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): Owned {
    return new Contract(address, _abi, signerOrProvider) as Owned;
  }
}
