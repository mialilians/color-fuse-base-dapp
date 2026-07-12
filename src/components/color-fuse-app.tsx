"use client";

import { Droplets, Loader2, Search, Sparkles, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { parseEventLogs, type Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  colorFuseAbi,
  colorFuseContractAddress,
  MAX_LABEL_LENGTH,
  MAX_NOTE_LENGTH,
  MOODS,
} from "@/lib/color-fuse";

const PRESETS = [
  { label: "Mint Signal", colorA: "#61ffd7", colorB: "#705cff", mood: "Signal", note: "A sharp blend for a small Base interface launch." },
  { label: "Sun Drop", colorA: "#ffbf4d", colorB: "#ff5d8f", mood: "Warm", note: "A bright swatch for an upbeat creator moment." },
  { label: "Pool Glass", colorA: "#55d6ff", colorB: "#baff7a", mood: "Fresh", note: "Cool, clean, and easy to spot inside a mobile app." },
] as const;

function shortAddress(address?: Address) {
  if (!address || address === "0x0000000000000000000000000000000000000000") return "--";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(value?: bigint) {
  if (!value) return "--";
  return new Date(Number(value) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function friendlyError(error: unknown) {
  if (!(error instanceof Error)) return "Transaction was cancelled.";
  if (error.message.includes("User rejected")) return "Request cancelled in wallet.";
  if (error.message.includes("Invalid label")) return "Label needs 1 to 36 characters.";
  if (error.message.includes("Invalid colors")) return "Colors must be valid hex values.";
  if (error.message.includes("Invalid mood")) return "Choose a mood.";
  if (error.message.includes("Invalid note")) return "Note needs 1 to 120 characters.";
  return error.message;
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function SwatchReceipt({
  label,
  colorA,
  colorB,
  mood,
  note,
  maker,
  createdAt,
}: {
  label: string;
  colorA: string;
  colorB: string;
  mood: string;
  note: string;
  maker?: Address;
  createdAt?: bigint;
}) {
  return (
    <article className="swatch-receipt">
      <div className="swatch-hero" style={{ background: `linear-gradient(135deg, ${colorA}, ${colorB})` }}>
        <span style={{ background: colorA }} />
        <span style={{ background: colorB }} />
      </div>
      <header>
        <p>Color Fuse</p>
        <h2>{label || "Untitled swatch"}</h2>
      </header>
      <section className="color-lines">
        <div><span>A</span><strong>{colorA}</strong></div>
        <div><span>B</span><strong>{colorB}</strong></div>
        <div><span>Mood</span><strong>{mood}</strong></div>
      </section>
      <blockquote>{note || "Save a public swatch receipt on Base."}</blockquote>
      <footer>
        <div><span>Wallet</span><strong>{shortAddress(maker)}</strong></div>
        <div><span>Mixed</span><strong>{formatDate(createdAt)}</strong></div>
      </footer>
    </article>
  );
}

export function ColorFuseApp() {
  const [fuseIdInput, setFuseIdInput] = useState("1");
  const [label, setLabel] = useState<string>(PRESETS[0].label);
  const [colorA, setColorA] = useState<string>(PRESETS[0].colorA);
  const [colorB, setColorB] = useState<string>(PRESETS[0].colorB);
  const [mood, setMood] = useState<string>(PRESETS[0].mood);
  const [note, setNote] = useState<string>(PRESETS[0].note);
  const [message, setMessage] = useState("Mix two colors, then save the swatch on Base.");
  const [lastAction, setLastAction] = useState<"save" | null>(null);

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync } = useDisconnect();
  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
    } catch {}
  }
  const { switchChain, isPending: switching } = useSwitchChain();
  const { data: hash, writeContractAsync, isPending: writing } = useWriteContract();
  const { data: receipt, isLoading: confirming } = useWaitForTransactionReceipt({ hash });
  const selectedConnector = connectors.find((connector) => connector.id === "injected") ?? connectors.find((connector) => connector.id === "baseAccount") ?? connectors[0];
  const parsedFuseId = BigInt(Math.max(1, Number(fuseIdInput || "1")));

  const fuseQuery = useReadContract({
    abi: colorFuseAbi,
    address: colorFuseContractAddress,
    functionName: "getFuse",
    args: [parsedFuseId],
    query: { enabled: Boolean(colorFuseContractAddress), refetchInterval: 12000 },
  });
  const totalQuery = useReadContract({
    abi: colorFuseAbi,
    address: colorFuseContractAddress,
    functionName: "nextFuseId",
    query: { enabled: Boolean(colorFuseContractAddress), refetchInterval: 12000 },
  });

  const tuple = fuseQuery.data as readonly [Address, string, string, string, string, string, bigint] | undefined;
  const liveFuse = useMemo(() => tuple ? {
    maker: tuple[0],
    label: tuple[1],
    colorA: tuple[2],
    colorB: tuple[3],
    mood: tuple[4],
    note: tuple[5],
    createdAt: tuple[6],
  } : undefined, [tuple]);

  const totalFuses = totalQuery.data ? Math.max(Number(totalQuery.data) - 1, 0) : 0;
  const validFields =
    label.trim().length > 0 &&
    label.trim().length <= MAX_LABEL_LENGTH &&
    isHexColor(colorA) &&
    isHexColor(colorB) &&
    mood.trim().length > 0 &&
    note.trim().length > 0 &&
    note.trim().length <= MAX_NOTE_LENGTH;
  const saveBlocker = !colorFuseContractAddress
    ? "Contract not deployed yet. Run npm run deploy:contract, then add NEXT_PUBLIC_COLOR_FUSE_CONTRACT_ADDRESS."
    : !isConnected
      ? "Connect wallet first."
      : chainId !== base.id
        ? "Switch to Base first."
        : !validFields
          ? "Fill label, colors, mood, and note."
          : "";

  useEffect(() => {
    if (!receipt || lastAction !== "save") return;
    void totalQuery.refetch();
    void fuseQuery.refetch();
    const logs = parseEventLogs({ abi: colorFuseAbi, logs: receipt.logs, eventName: "FuseSaved" });
    const fuseId = logs[0]?.args.fuseId;
    window.setTimeout(() => {
      if (fuseId) setFuseIdInput(fuseId.toString());
      setMessage(fuseId ? `Swatch #${fuseId.toString()} saved on Base.` : "Swatch saved on Base.");
    }, 0);
  }, [lastAction, receipt, totalQuery, fuseQuery]);

  async function connectWallet() {
    const queue = [connectors.find((connector) => connector.id === "injected"), connectors.find((connector) => connector.id === "baseAccount"), selectedConnector]
      .filter((connector): connector is NonNullable<typeof selectedConnector> => Boolean(connector))
      .filter((connector, index, list) => list.findIndex((item) => item.id === connector.id) === index);
    if (!queue.length) {
      setMessage("No wallet connector found. Open this app inside Base App or a wallet browser.");
      return;
    }
    let lastError: unknown;
    setMessage("Opening wallet connection...");
    for (const connector of queue) {
      try {
        await connectAsync({ connector });
        setMessage("Wallet connected. Save the swatch when ready.");
        return;
      } catch (error) {
        lastError = error;
      }
    }
    setMessage(friendlyError(lastError));
  }

  async function saveFuse() {
    const contractAddress = colorFuseContractAddress;
    if (saveBlocker) {
      setMessage(saveBlocker);
      return;
    }
    if (!contractAddress) return;
    try {
      setLastAction("save");
      setMessage("Confirm the color fuse in your wallet.");
      await writeContractAsync({
        address: contractAddress,
        abi: colorFuseAbi,
        functionName: "saveFuse",
        args: [label.trim(), colorA, colorB, mood.trim(), note.trim()],
        chainId: base.id,
      });
      setMessage("Swatch sent. Waiting for Base confirmation...");
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }

  function applyPreset(index: number) {
    const preset = PRESETS[index];
    setLabel(preset.label);
    setColorA(preset.colorA);
    setColorB(preset.colorB);
    setMood(preset.mood);
    setNote(preset.note);
  }

  return (
    <main className="color-shell">
      <section className="mix-panel">
        <header className="mix-head">
          <div><p>Color Fuse</p><h1>Mix a swatch.</h1></div>
          <Droplets />
        </header>
        <div className="mix-stats">
          <div><span>Swatches</span><strong>{totalFuses}</strong></div>
          <div><span>Chain</span><strong>Base</strong></div>
        </div>
        <div className="preset-row">
          {PRESETS.map((preset, index) => (
            <button key={preset.label} onClick={() => applyPreset(index)}>
              <span style={{ background: `linear-gradient(135deg, ${preset.colorA}, ${preset.colorB})` }} />
              <div><strong>{preset.label}</strong><small>{preset.colorA} + {preset.colorB}</small></div>
            </button>
          ))}
        </div>
        <label><span>Label</span><input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={MAX_LABEL_LENGTH} /></label>
        <div className="color-inputs">
          <label><span>Color A</span><input type="color" value={colorA} onChange={(event) => setColorA(event.target.value)} /></label>
          <label><span>Color B</span><input type="color" value={colorB} onChange={(event) => setColorB(event.target.value)} /></label>
        </div>
        <div className="mood-row">
          {MOODS.map((item) => <button key={item} className={mood === item ? "active" : ""} onClick={() => setMood(item)}>{item}</button>)}
        </div>
        <div className="mix-actions">
          {isConnected && chainId !== base.id ? (
            <button className="save-fuse" disabled={switching} onClick={() => switchChain({ chainId: base.id })}>{switching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Switch to Base</button>
          ) : (
            <button className="save-fuse" disabled={writing || confirming} onClick={saveFuse}>{writing || confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Save on Base</button>
          )}
          {isConnected ? (
            <button className="wallet" onClick={disconnectWallet}>{shortAddress(address)}</button>
          ) : (
            <button className="wallet" disabled={!selectedConnector || connecting} onClick={connectWallet}>{connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}Connect wallet</button>
          )}
        </div>
        <label><span>Note</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={MAX_NOTE_LENGTH} rows={3} /></label>
        <p className="mix-status">{message}</p>
        {hash ? <a className="mix-tx" href={`https://basescan.org/tx/${hash}`} rel="noreferrer" target="_blank">View transaction on BaseScan</a> : null}
      </section>
      <section className="mix-stage">
        <SwatchReceipt
          label={liveFuse?.label || label}
          colorA={liveFuse?.colorA || colorA}
          colorB={liveFuse?.colorB || colorB}
          mood={liveFuse?.mood || mood}
          note={liveFuse?.note || note}
          maker={liveFuse?.maker}
          createdAt={liveFuse?.createdAt}
        />
        <div className="stage-lower">
          <section className="load-fuse"><div><Search /><h2>Load swatch</h2></div><label><span>Fuse ID</span><input value={fuseIdInput} onChange={(event) => setFuseIdInput(event.target.value.replace(/\D/g, ""))} /></label></section>
          <section className="about-fuse"><p>What it does</p><strong>Color Fuse saves a two-color blend with label, mood, note, wallet, and timestamp on Base.</strong></section>
        </div>
      </section>
    </main>
  );
}
