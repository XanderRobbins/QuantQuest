const BASE_URL = "http://api.nessieisreal.com";

function apiKey(): string {
  const key = process.env.NESSIE_API_KEY;
  if (!key) throw new Error("NESSIE_API_KEY not configured");
  return key;
}

function url(path: string): string {
  return `${BASE_URL}${path}?key=${apiKey()}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NessieCustomer {
  _id: string;
  first_name: string;
  last_name: string;
}

export interface NessieAccount {
  _id: string;
  type: string;
  nickname: string;
  balance: number;
  customer_id: string;
}

export interface NessieDeposit {
  _id: string;
  amount: number;
  description: string;
  status: string;
  transaction_date: string;
}

// ─── Customers ───────────────────────────────────────────────────────────────

export async function createCustomer(username: string): Promise<NessieCustomer> {
  const [first_name, ...rest] = username.trim().split(" ");
  const last_name = rest.join(" ") || "User";

  const res = await fetch(url("/customers"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      first_name,
      last_name,
      address: {
        street_number: "2301",
        street_name: "Vanderbilt Pl",
        city: "Nashville",
        state: "TN",
        zip: "37212",
      },
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.objectCreated) {
    throw new Error(data.message ?? "Failed to create Nessie customer");
  }
  return data.objectCreated as NessieCustomer;
}

// ─── Accounts ────────────────────────────────────────────────────────────────

export async function createAccount(
  customerId: string,
  initialBalance = 10000
): Promise<NessieAccount> {
  const res = await fetch(url(`/customers/${customerId}/accounts`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "Checking",
      nickname: "QuantQuest Portfolio",
      rewards: 0,
      balance: initialBalance,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.objectCreated) {
    throw new Error(data.message ?? "Failed to create Nessie account");
  }
  return data.objectCreated as NessieAccount;
}

export async function getAccount(accountId: string): Promise<NessieAccount> {
  const res = await fetch(url(`/accounts/${accountId}`));
  if (!res.ok) throw new Error("Account not found");
  return res.json() as Promise<NessieAccount>;
}

// ─── Deposits ────────────────────────────────────────────────────────────────

export async function createDeposit(
  accountId: string,
  amount: number,
  description: string
): Promise<NessieDeposit> {
  const today = new Date().toISOString().split("T")[0];
  const res = await fetch(url(`/accounts/${accountId}/deposits`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      medium: "balance",
      amount,
      transaction_date: today,
      status: "completed",
      description,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.objectCreated) {
    throw new Error(data.message ?? "Failed to create deposit");
  }
  return data.objectCreated as NessieDeposit;
}

// ─── Withdrawals ─────────────────────────────────────────────────────────────

export async function createWithdrawal(
  accountId: string,
  amount: number,
  description: string
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const res = await fetch(url(`/accounts/${accountId}/withdrawals`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      medium: "balance",
      amount: Math.round(amount),
      transaction_date: today,
      status: "completed",
      description,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { message?: string }).message ?? `Nessie withdrawal failed (${res.status})`
    );
  }
}
