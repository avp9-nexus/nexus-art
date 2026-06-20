// nexus_scan_server.mjs — serveur MCP stdio (JSON-RPC 2.0 newline-delimited), pur Node, ZÉRO dépendance npm.
//
// Rôle : exposer UN tool MCP "scan" = détection ON-CHAIN-ONLY des enchères NEXUS actives (Base Sepolia).
//   Read-only strict : eth_chainId / eth_blockNumber / eth_getLogs / eth_call uniquement.
//   AUCUN fetch tiers — le bloc fetch métadonnées Arweave de nexus-monitor/scan.mjs (ex-L.254-284) est
//   RETIRÉ ici (relocalisé dans nexus-evaluate, où le contenu tiers sera durci contre l'injection).
//   AUCUN secret — env = NEXUS_RPC_URL + NEXUS_AUCTION_ADDRESS (non-secrets).
//
// La logique on-chain (keccak256 pur-JS, RPC failover, décodage ABI) est REPRISE TELLE QUELLE de
// nexus-poc-001/skills/nexus-monitor/scan.mjs (auditée Étape 5), au champ `metadata` près (supprimé).
//
// ⚠️ stdout = canal JSON-RPC RÉSERVÉ : la logique scan n'écrit JAMAIS sur stdout ; elle RETOURNE son objet,
//    que le serveur emballe dans le `result` du tools/call. Tous les logs vont en fichier + stderr.
//
// Cadre : un serveur MCP n'est PAS un skill → vit hors de skills/ (hors extraDirs). Bloc 1/2 : standalone,
//   agent non lancé, pas de déclaration mcp.servers, pas de tools.deny (→ bloc 2).

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const EXPECTED_CHAIN_ID = 84532;
const SERVER_NAME = "nexus_scan";
const SERVER_VERSION = "0.1.0";
const PROTOCOL_FALLBACK = "2025-06-18"; // utilisé seulement si le client n'envoie pas de protocolVersion
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------- Log helper (fichier + stderr — JAMAIS stdout) ----------------------
const LOG_FILE = process.env.NEXUS_SCAN_LOG || path.join(__dirname, "nexus-scan-server.log");
try { fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true }); } catch {}
function log(level, msg) {
  const line = `${new Date().toISOString()} [${level}] ${msg}\n`;
  try { fs.appendFileSync(LOG_FILE, line); } catch {}
  // stderr est autorisé (le transport stdio l'ignore/le pipe) ; stdout est INTERDIT côté logique.
  try { process.stderr.write(line); } catch {}
}

// ---------------------- Keccak-256 (pur JS) ---------------------- [verbatim scan.mjs]
// Adapté de l'implémentation publique référence Keccak-f[1600], rate 1088, capacity 512.
const RC = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n
];
const R = [
  [0n, 36n, 3n, 41n, 18n],
  [1n, 44n, 10n, 45n, 2n],
  [62n, 6n, 43n, 15n, 61n],
  [28n, 55n, 25n, 21n, 56n],
  [27n, 20n, 39n, 8n, 14n]
];
const MASK64 = (1n << 64n) - 1n;
function rotl64(x, n) { n = n % 64n; return ((x << n) | (x >> (64n - n))) & MASK64; }
function keccakF(state) {
  for (let round = 0; round < 24; round++) {
    // θ
    const C = new Array(5);
    for (let x = 0; x < 5; x++) C[x] = state[x] ^ state[x+5] ^ state[x+10] ^ state[x+15] ^ state[x+20];
    const D = new Array(5);
    for (let x = 0; x < 5; x++) D[x] = C[(x+4)%5] ^ rotl64(C[(x+1)%5], 1n);
    for (let i = 0; i < 25; i++) state[i] = state[i] ^ D[i%5];
    // ρ et π
    const B = new Array(25).fill(0n);
    for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) {
      B[y + ((2*x + 3*y) % 5) * 5] = rotl64(state[x + 5*y], R[x][y]);
    }
    // χ
    for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) {
      state[x + 5*y] = B[x + 5*y] ^ ((~B[((x+1)%5) + 5*y]) & MASK64 & B[((x+2)%5) + 5*y]);
    }
    // ι
    state[0] = state[0] ^ RC[round];
  }
}
function keccak256(data) {
  // data : Uint8Array
  const rate = 136; // 1088/8
  const state = new Array(25).fill(0n);
  // pad : append 0x01 ... 0x80 (Keccak original, pas SHA3)
  const padded = new Uint8Array(Math.ceil((data.length + 1) / rate) * rate);
  padded.set(data);
  padded[data.length] = 0x01;
  padded[padded.length - 1] |= 0x80;
  for (let off = 0; off < padded.length; off += rate) {
    for (let i = 0; i < rate / 8; i++) {
      let lane = 0n;
      for (let j = 0; j < 8; j++) lane |= BigInt(padded[off + i*8 + j]) << BigInt(8*j);
      state[i] ^= lane;
    }
    keccakF(state);
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 4; i++) {
    let lane = state[i];
    for (let j = 0; j < 8; j++) {
      out[i*8 + j] = Number(lane & 0xffn);
      lane >>= 8n;
    }
  }
  return out;
}
function toHex(bytes) { return "0x" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join(""); }
function utf8ToBytes(s) { return new TextEncoder().encode(s); }
function keccakHex(s) { return toHex(keccak256(utf8ToBytes(s))); }

// Self-test : keccak256("") = c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
// Fail-fast au démarrage (avant tout JSON-RPC) ; n'écrit pas sur stdout.
const _empty = toHex(keccak256(new Uint8Array(0)));
if (_empty !== "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470") {
  log("error", `keccak256 self-test FAILED: ${_empty}`);
  process.exit(3);
}

// ---------------------- ABI helpers ---------------------- [verbatim scan.mjs]
function hexToBigInt(h) { return BigInt(h); }
function padLeft(hex, len = 64) { hex = hex.replace(/^0x/, ""); return hex.padStart(len, "0"); }
function decodeUint256(hex32) { return BigInt("0x" + hex32); }
function decodeAddress(hex32) { return "0x" + hex32.slice(24); }
function decodeBool(hex32) { return BigInt("0x" + hex32) !== 0n; }
function chunks(hexNoPrefix, size = 64) {
  const out = [];
  for (let i = 0; i < hexNoPrefix.length; i += size) out.push(hexNoPrefix.slice(i, i + size));
  return out;
}

// ---------------------- Sélecteurs / topics ---------------------- [verbatim scan.mjs]
const TOPIC_AUCTION_STARTED = keccakHex("AuctionStarted(uint256,uint256,uint256,string)");
const SEL_GET_AUCTION = keccakHex("getAuction(uint256)").slice(0, 10); // 4 octets
const SEL_TOKEN_URI = keccakHex("tokenURI(uint256)").slice(0, 10);

// ---------------------- RPC (un endpoint) ---------------------- [verbatim scan.mjs]
async function rpcOne(url, method, params) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: ctrl.signal
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    if (j.error) throw new Error(`RPC error: ${j.error.message}`);
    return j.result;
  } finally { clearTimeout(t); }
}

function redactRpcUrl(u){
  if(!u) return null;
  try{ const x=new URL(u); return x.protocol+"//"+x.host+"/…"; }
  catch{ return "…"; }
}

// ---------------------- Scan ON-CHAIN — RETOURNE l'objet, n'écrit PAS sur stdout ----------------------
async function runScan() {
  // Config lue à l'appel (lazy) — divergence assumée vs scan.mjs (one-shot) : un serveur long-vivant ne doit
  // pas s'auto-tuer si l'env manque ; il lève une erreur emballée dans le result (isError).
  const RPC_PRIMARY = process.env.NEXUS_RPC_URL;
  const RPC_FALLBACK = process.env.NEXUS_RPC_FALLBACK_URL || "";
  const CONTRACT = process.env.NEXUS_AUCTION_ADDRESS;
  const FROM_BLOCK_ENV = process.env.NEXUS_MONITOR_FROM_BLOCK;
  if (!RPC_PRIMARY || !CONTRACT) throw new Error("Missing NEXUS_RPC_URL or NEXUS_AUCTION_ADDRESS");

  // RPC avec failover (closure sur RPC_PRIMARY/RPC_FALLBACK) — logique verbatim scan.mjs
  async function rpc(method, params) {
    const delays = [500, 1000, 2000];
    let lastErr;
    for (let i = 0; i < 3; i++) {
      try { return await rpcOne(RPC_PRIMARY, method, params); }
      catch (e) {
        lastErr = e;
        log("warn", `primary RPC ${method} fail (${i+1}/3): ${e.message}`);
        if (i < 2) await new Promise(r => setTimeout(r, delays[i]));
      }
    }
    if (RPC_FALLBACK) {
      log("warn", `[failover] primary→fallback for ${method}`);
      try { return await rpcOne(RPC_FALLBACK, method, params); }
      catch (e) { log("error", `fallback also failed: ${e.message}`); throw e; }
    }
    throw lastErr;
  }

  const scannedAt = new Date().toISOString();

  // chainId — garde-fou ≠ 84532
  const cidHex = await rpc("eth_chainId", []);
  const chainId = Number(hexToBigInt(cidHex));
  if (chainId !== EXPECTED_CHAIN_ID) {
    log("error", `Refus: chainId=${chainId} ≠ ${EXPECTED_CHAIN_ID}`);
    throw new Error(`wrong_chain: chainId=${chainId} (attendu ${EXPECTED_CHAIN_ID})`);
  }

  const blockHex = await rpc("eth_blockNumber", []);
  const toBlock = Number(hexToBigInt(blockHex));
  const fromBlock = FROM_BLOCK_ENV ? Number(FROM_BLOCK_ENV) : Math.max(0, toBlock - 5000);

  log("info", `scan start chainId=${chainId} contract=${CONTRACT} blocks=${fromBlock}..${toBlock}`);

  // eth_getLogs — fenêtres de 2000 blocs (limite RPC publique)
  const WINDOW = 2000;
  const logs = [];
  for (let start = fromBlock; start <= toBlock; start += WINDOW) {
    const end = Math.min(start + WINDOW - 1, toBlock);
    const part = await rpc("eth_getLogs", [{
      address: CONTRACT,
      fromBlock: "0x" + start.toString(16),
      toBlock: "0x" + end.toString(16),
      topics: [TOPIC_AUCTION_STARTED]
    }]);
    logs.push(...part);
  }

  log("info", `found ${logs.length} AuctionStarted events`);

  const candidates = new Map(); // tokenId(string) -> { reservePrice, endTime, uri, blockNumber }
  for (const ev of logs) {
    // tokenId est topics[1] (indexed)
    const tokenId = decodeUint256(ev.topics[1].slice(2));
    const dataHex = ev.data.slice(2);
    const words = chunks(dataHex);
    // word0: reservePrice (uint256), word1: endTime (uint256), word2: offset string, word3+: length+data
    const reservePrice = BigInt("0x" + words[0]);
    const endTime = BigInt("0x" + words[1]);
    // string : offset = word2, à offset on a length puis bytes
    const offset = Number(BigInt("0x" + words[2]));
    const strLenHex = dataHex.slice(offset * 2, offset * 2 + 64);
    const strLen = Number(BigInt("0x" + strLenHex));
    const strHex = dataHex.slice(offset * 2 + 64, offset * 2 + 64 + strLen * 2);
    const uri = Buffer.from(strHex, "hex").toString("utf8");
    candidates.set(tokenId.toString(), { reservePrice, endTime, uri, blockNumber: Number(BigInt(ev.blockNumber)) });
  }

  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  const auctions = [];

  for (const [tokenIdStr, ev] of candidates) {
    // eth_call getAuction(tokenId)
    const tokenIdHex = padLeft(BigInt(tokenIdStr).toString(16));
    const callData = SEL_GET_AUCTION + tokenIdHex;
    let res;
    try {
      res = await rpc("eth_call", [{ to: CONTRACT, data: callData }, "latest"]);
    } catch (e) {
      log("warn", `getAuction(${tokenIdStr}) failed: ${e.message}`);
      continue;
    }
    const w = chunks(res.slice(2));
    // struct Auction { uint256 reservePrice; uint256 highestBid; address highestBidder; uint64 endTime; bool settled; bool exists; }
    const reservePrice = decodeUint256(w[0]);
    const highestBid = decodeUint256(w[1]);
    const highestBidder = decodeAddress(w[2]);
    const endTime = decodeUint256(w[3]);
    const settled = decodeBool(w[4]);
    const exists = decodeBool(w[5]);

    if (!exists) { log("info", `tokenId=${tokenIdStr} no longer exists`); continue; }
    if (settled) { log("info", `tokenId=${tokenIdStr} already settled`); continue; }
    if (endTime <= nowSec) { log("info", `tokenId=${tokenIdStr} expired`); continue; }

    // tokenURI — on-chain (renvoie la chaîne ar://… = identifiant, PAS de fetch). Reste.
    let tokenUri = ev.uri;
    try {
      const r = await rpc("eth_call", [{ to: CONTRACT, data: SEL_TOKEN_URI + tokenIdHex }, "latest"]);
      const rw = chunks(r.slice(2));
      const strLen = Number(BigInt("0x" + rw[1]));
      const strHex = r.slice(2).slice(128, 128 + strLen * 2);
      tokenUri = Buffer.from(strHex, "hex").toString("utf8");
    } catch (e) {
      log("warn", `tokenURI(${tokenIdStr}) failed, fallback to event uri: ${e.message}`);
    }

    // ⚠️ ON-CHAIN-ONLY : le fetch métadonnées Arweave (scan.mjs L.254-284) + le champ `metadata` sont RETIRÉS.
    //    L'identifiant tokenUri (ar://…) est transmis tel quel ; nexus-evaluate fera le fetch (durci).

    const secondsRemaining = Number(endTime - nowSec);
    const ethStr = (Number(reservePrice) / 1e18).toString();
    auctions.push({
      tokenId: Number(tokenIdStr),
      reservePriceWei: reservePrice.toString(),
      reservePriceEth: ethStr,
      endTime: Number(endTime),
      secondsRemaining,
      currentBid: highestBid.toString(),
      highestBidder,
      tokenUri
    });
  }

  const out = {
    scannedAt,
    chainId,
    contract: CONTRACT,
    fromBlock,
    toBlock,
    rpc: { primary: redactRpcUrl(RPC_PRIMARY), fallback: redactRpcUrl(RPC_FALLBACK) },
    auctions
  };
  log("info", `scan done : ${auctions.length} active auctions`);
  return out;
}

// ====================== Serveur MCP stdio (JSON-RPC 2.0 newline-delimited) ======================
// Framing = celui qu'attend le client MCP d'OpenClaw (@modelcontextprotocol/sdk : ReadBuffer + serializeMessage)
// → un message = une ligne JSON + "\n", sans "\n" interne. Le client PILOTE le handshake ; on RÉPOND à 4 messages.

const TOOL_SCAN = {
  name: "scan",
  description:
    "Détecte les enchères NEXUS actives on-chain (Base Sepolia, chainId 84532). Read-only strict : " +
    "eth_getLogs/eth_call uniquement, AUCUN fetch tiers, AUCUN secret. Retourne { scannedAt, chainId, " +
    "contract, fromBlock, toBlock, auctions:[{ tokenId, reservePriceWei, reservePriceEth, endTime, " +
    "secondsRemaining, currentBid, highestBidder, tokenUri }] }.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false
  }
};

function writeMessage(msg) {
  // SEUL point d'écriture stdout du process. Framing newline-delimited.
  process.stdout.write(JSON.stringify(msg) + "\n");
}
function sendResult(id, result) { writeMessage({ jsonrpc: "2.0", id, result }); }
function sendError(id, code, message) { writeMessage({ jsonrpc: "2.0", id, error: { code, message } }); }

async function handleMessage(msg) {
  const { id, method, params } = msg;
  // Pas de method => c'est une réponse/echo : ignorer.
  if (typeof method !== "string") return;
  // Notifications (sans id) : ne JAMAIS répondre.
  const isNotification = (id === undefined || id === null);

  try {
    if (method === "initialize") {
      const clientProto = params && typeof params.protocolVersion === "string" && params.protocolVersion.length > 0
        ? params.protocolVersion
        : PROTOCOL_FALLBACK;
      log("info", `initialize (client protocolVersion=${clientProto})`);
      sendResult(id, {
        protocolVersion: clientProto, // ÉCHO du protocolVersion client
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION }
      });
      return;
    }
    if (method === "notifications/initialized" || method === "initialized") {
      // Notification post-handshake : aucune réponse.
      return;
    }
    if (method === "ping") {
      if (!isNotification) sendResult(id, {});
      return;
    }
    if (method === "tools/list") {
      sendResult(id, { tools: [TOOL_SCAN] });
      return;
    }
    if (method === "tools/call") {
      const toolName = params && params.name;
      if (toolName !== "scan") {
        sendError(id, -32602, `unknown tool: ${String(toolName)}`);
        return;
      }
      try {
        const scanOut = await runScan();
        sendResult(id, { content: [{ type: "text", text: JSON.stringify(scanOut, null, 2) }] });
      } catch (e) {
        // Échec scan = erreur de l'OUTIL (pas du protocole) → result isError, l'agent voit le message.
        log("error", `scan failed: ${e.stack || e.message}`);
        sendResult(id, {
          content: [{ type: "text", text: JSON.stringify({ error: "scan_failed", message: e.message }) }],
          isError: true
        });
      }
      return;
    }
    // Méthode inconnue
    if (!isNotification) sendError(id, -32601, `method not found: ${method}`);
  } catch (e) {
    log("error", `handler error for ${method}: ${e.stack || e.message}`);
    if (!isNotification) sendError(id, -32603, e.message);
  }
}

// ---- Lecture stdin : buffer + découpage sur "\n" (gère lignes partielles / multi-lignes par chunk) ----
let stdinBuffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  stdinBuffer += chunk;
  let idx;
  while ((idx = stdinBuffer.indexOf("\n")) !== -1) {
    const line = stdinBuffer.slice(0, idx);
    stdinBuffer = stdinBuffer.slice(idx + 1);
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    let parsed;
    try { parsed = JSON.parse(trimmed); }
    catch (e) { log("error", `bad JSON on stdin (ignored): ${e.message}`); continue; }
    // handleMessage est async ; le client MCP appelle séquentiellement (attend chaque réponse).
    handleMessage(parsed);
  }
});
process.stdin.on("end", () => {
  // Flush d'une éventuelle dernière ligne sans "\n" final.
  const trimmed = stdinBuffer.trim();
  if (trimmed.length > 0) {
    try { handleMessage(JSON.parse(trimmed)); } catch (e) { log("error", `bad JSON at end: ${e.message}`); }
  }
  log("info", "stdin closed — exiting");
  process.exit(0);
});

log("info", `${SERVER_NAME} v${SERVER_VERSION} ready (stdio MCP, on-chain-only, zero-dep)`);
