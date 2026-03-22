import {
  Connection,
  Keypair,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

function getKeypair(): Keypair {
  const raw = process.env.SOLANA_PRIVATE_KEY;
  if (!raw) throw new Error("SOLANA_PRIVATE_KEY not set");
  const parsed = JSON.parse(raw) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(parsed));
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

  const memo = JSON.stringify({
    app: "QuantQuest",
    user: trade.userId.slice(0, 12),
    investment: trade.investment,
    type: trade.type,
    amount: trade.amount,
    ts: trade.timestamp,
  });

  const tx = new Transaction().add(
    new TransactionInstruction({
      keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: false }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memo, "utf8"),
    })
  );

  const signature = await sendAndConfirmTransaction(connection, tx, [keypair]);
  return signature;
}

export function getExplorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function getWalletAddress(): string {
  return getKeypair().publicKey.toBase58();
}
