import { Address, BigInt } from "@graphprotocol/graph-ts";

import { UserBalance } from "../../generated/schema";
import { loadSubgraphConfig } from "./loadSubgraphConfig";
import { getUserBalanceId } from "../utils";

export function createOrUpdateUserBalance(
  userAddress: Address,
  poolAddress: Address,
  amountIncrease: BigInt,
  module: string
): void {
  loadSubgraphConfig(); // create config subgraph if it doesn't exist

  let id = getUserBalanceId(userAddress, poolAddress);
  let balance = UserBalance.load(id);

  if (!balance) {
    balance = new UserBalance(id);
    balance.value = BigInt.fromI32(0);
    balance.pool = poolAddress;
    balance.user = userAddress.toHex();
    balance.module = module;
  }

  balance.value = balance.value.plus(amountIncrease);
  balance.save();
}