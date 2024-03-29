import { Address } from "@graphprotocol/graph-ts";
import { User } from "../../../generated/schema";

export function loadOrCreateUser(address: Address): User {
  let id = address.toHex();
  let user = User.load(id);

  if (!user) {
    user = new User(id);
    user.active = false;
    user.stakingPools = [];
    user.yearnVaults = [];
    user.basisVaults = [];
    user.save();
  }

  return user as User;
}

export function loadUser(address: Address): User | null {
  let id = address.toHex();
  let user = User.load(id);

  return user;
}
