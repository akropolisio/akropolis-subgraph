import { BigInt, dataSource } from "@graphprotocol/graph-ts";

import { User } from "../../generated/schema";
import {
  Transfer,
  ERC20Detailed,
} from "../../generated/Contracts/ERC20Detailed";
import {
  createOrUpdateDepositedBalance,
  loadDepositedBalance,
  loadUser,
} from "../entities/shared";
import { deactivateUserIfZeroBalance } from "../entities/globalStats";
import { loadVault } from "../entities/yearnVaultSavings";
import { exclude } from "../utils";

export function handleTransfer(event: Transfer): void {
  let vaultAddress = dataSource.address();
  let userAddress = event.params.from;
  let user = loadUser(userAddress);

  if (!user || !user.yearnVaults.includes(vaultAddress.toHex())) {
    return;
  }

  let contract = ERC20Detailed.bind(vaultAddress);
  let userBalance = contract.balanceOf(userAddress);

  if (userBalance.le(BigInt.fromI32(0))) {
    user.yearnVaults = exclude(user.yearnVaults, vaultAddress.toHex());
    deactivateUserIfZeroBalance(user as User);
    user.save();
  }

  // TODO what if there is multiple withdraws in one transaction
  let deposited = loadDepositedBalance(userAddress, vaultAddress);

  let balanceBeforeTransfer = userBalance.plus(event.params.value);
  let shareMultiplier = BigInt.fromI32(1000000000);
  let share = balanceBeforeTransfer.isZero()
    ? BigInt.fromI32(0)
    : event.params.value.times(shareMultiplier).div(balanceBeforeTransfer);
  let withdrawTVLAmount = deposited.value.times(share).div(shareMultiplier);

  createOrUpdateDepositedBalance(
    userAddress,
    vaultAddress,
    withdrawTVLAmount.neg()
  );

  let pool = loadVault(vaultAddress);
  pool.totalTVL = pool.totalTVL.minus(withdrawTVLAmount);
  pool.save();
}
