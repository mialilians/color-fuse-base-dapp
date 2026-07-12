import type { Address } from "viem";

export const MAX_LABEL_LENGTH = 36;
export const MAX_NOTE_LENGTH = 120;
export const MOODS = ["Fresh", "Warm", "Signal", "Dream"] as const;

export const colorFuseAbi = [
  {
    type: "event",
    name: "FuseSaved",
    inputs: [
      { name: "fuseId", type: "uint256", indexed: true },
      { name: "maker", type: "address", indexed: true },
      { name: "label", type: "string", indexed: false },
      { name: "colorA", type: "string", indexed: false },
      { name: "colorB", type: "string", indexed: false },
    ],
  },
  {
    type: "function",
    name: "saveFuse",
    stateMutability: "nonpayable",
    inputs: [
      { name: "label", type: "string" },
      { name: "colorA", type: "string" },
      { name: "colorB", type: "string" },
      { name: "mood", type: "string" },
      { name: "note", type: "string" },
    ],
    outputs: [{ name: "fuseId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getFuse",
    stateMutability: "view",
    inputs: [{ name: "fuseId", type: "uint256" }],
    outputs: [
      { name: "maker", type: "address" },
      { name: "label", type: "string" },
      { name: "colorA", type: "string" },
      { name: "colorB", type: "string" },
      { name: "mood", type: "string" },
      { name: "note", type: "string" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "nextFuseId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function isAddressLike(value?: string) {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value));
}

const configuredColorFuseContractAddress =
  process.env.NEXT_PUBLIC_COLOR_FUSE_CONTRACT_ADDRESS?.trim();

export const colorFuseContractAddress = isAddressLike(configuredColorFuseContractAddress)
  ? (configuredColorFuseContractAddress as Address)
  : undefined;
