import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as relations from "./relations";

function createDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString);
  return drizzle(client, { schema: { ...schema, ...relations } });
}

type Database = ReturnType<typeof createDb>;

let dbInstance: Database | undefined;

function getDb(): Database {
  dbInstance ??= createDb();
  return dbInstance;
}

export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    return Reflect.get(getDb(), property, receiver);
  },
});

export * from "./schema";
export * from "./relations";
export * from "./defaults";
export * from "./provisioning";
export {
  eq,
  and,
  or,
  gt,
  lt,
  gte,
  lte,
  desc,
  asc,
  like,
  ilike,
  isNull,
  isNotNull,
  inArray,
  sql,
} from "drizzle-orm";
export type { InferSelectModel, InferInsertModel } from "drizzle-orm";
