import {
  Connection,
  Keypair,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  sendAndConfirmTransaction,
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

function getOrCreateKeypair(): Keypair {
  const stored = process.env.SOLANA_PRIVATE_KEY;
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as number[];
      return Keypair.fromSecretKey(Uint8Array.from(parsed));
    } catch {
      // fall through to generate new
    }
  }
  // Generate a fresh keypair for this session
  return Keypair.generate();
}

// Lazy singleton keypair
let _keypair: Keypair | null = null;
function getKeypair(): Keypair {
  if (!_keypair) _keypair = getOrCreateKeypair();
  return _keypair;
}

async function ensureFunded(): Promise<boolean> {
  const keypair = getKeypair();
  try {
    const balance = await connection.getBalance(keypair.publicKey);
    if (balance >= 0.01 * LAMPORTS_PER_SOL) return true;

    // Try airdrop
    try {
      const sig = await connection.requestAirdrop(keypair.publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, "confirmed");
      return true;
    } catch {
      // Airdrop rate-limited or failed
      console.warn(
        `[Solana] Wallet ${keypair.publicKey.toBase58()} has no SOL. ` +
        `Visit https://faucet.solana.com to fund it on devnet.`
      );
      return false;
    }
  } catch {
    return false;
  }
}

export interface TradeRecord {
  userId: string;
  investment: string;
  type: string;
  amount: number;
  timestamp: string;
}

export async function recordTradeOnChain(trade: TradeRecord): Promise<string> {
  const keypair = getKeypair();

  const funded = await ensureFunded();
  if (!funded) {
    throw new Error("Solana wallet has no SOL — skipping on-chain recording");
  }

  const memo = JSON.stringify({
    app: "QuantQuest",
    user: trade.userId.slice(0, 12),
    investment: trade.investment,
    type: trade.type,
    amount: trade.amount,
    ts: trade.timestamp,
  });

  const memoInstruction = new TransactionInstruction({
    keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo, "utf8"),
  });

  const transaction = new Transaction().add(memoInstruction);

  const signature = await sendAndConfirmTransaction(connection, transaction, [
    keypair,
  ]);

  return signature;
}

export function getExplorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function getWalletAddress(): string {
  return getKeypair().publicKey.toBase58();
}
