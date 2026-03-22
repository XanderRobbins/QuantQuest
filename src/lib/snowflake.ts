import type { Connection } from "snowflake-sdk";

let _connection: Connection | null = null;

async function getConnection(): Promise<Connection> {
  if (_connection) return _connection;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const snowflake = require("snowflake-sdk") as typeof import("snowflake-sdk");
  snowflake.configure({ logLevel: "ERROR" });

  const conn = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT!,
    username: process.env.SNOWFLAKE_USER!,
    password: process.env.SNOWFLAKE_PASSWORD!,
    database: process.env.SNOWFLAKE_DATABASE || "QUANTQUEST",
    warehouse: process.env.SNOWFLAKE_WAREHOUSE || "COMPUTE_WH",
    schema: process.env.SNOWFLAKE_SCHEMA || "PUBLIC",
  });

  await new Promise<void>((resolve, reject) => {
    conn.connect((err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  _connection = conn;
  return conn;
}

export async function snowflakeQuery<T = Record<string, unknown>>(
  sql: string
): Promise<T[]> {
  const conn = await getConnection();
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText: sql,
      complete: (err, _stmt, rows) => {
        if (err) reject(err);
        else resolve((rows ?? []) as T[]);
      },
    });
  });
}

export function isSnowflakeConfigured(): boolean {
  return !!(
    process.env.SNOWFLAKE_ACCOUNT &&
    process.env.SNOWFLAKE_USER &&
    process.env.SNOWFLAKE_PASSWORD
  );
}
