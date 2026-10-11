import type { AccountDirectory } from './account-server';
import { inShopDatabaseQueue } from './neon-book';

export interface SqlStatement {
  readonly text: string;
  readonly values: readonly unknown[];
}

/** The slice of the Neon serverless driver the directory uses: tagged statements and one transaction. */
export interface AccountSql {
  (strings: TemplateStringsArray, ...values: unknown[]): SqlStatement;
  transaction(statements: SqlStatement[]): Promise<unknown>;
}

type Connect = (url: string) => Promise<AccountSql>;

const connectNeon: Connect = async (url) => {
  const { neon } = await import('@neondatabase/serverless');
  return neon(url) as unknown as AccountSql;
};

/**
 * Real accounts, changed through the database the Node server already writes to. Neon Auth keeps its
 * users in `neon_auth`; deleting one cascades to its sessions, sign-in methods, profile, and roles.
 * Orders are unlinked first, in the same transaction, so the shop keeps them.
 */
export function neonAccountDirectory(
  url = process.env['DATABASE_URL'],
  connect: Connect = connectNeon,
): AccountDirectory | null {
  if (!url) {
    return null;
  }
  const run = (build: (sql: AccountSql) => SqlStatement[]): Promise<void> =>
    inShopDatabaseQueue(async () => {
      const sql = await connect(url);
      await sql.transaction(build(sql));
    });
  return {
    rename: (id, name) =>
      run((sql) => [
        sql`update neon_auth."user" set name = ${name}, "updatedAt" = now() where id = ${id}::uuid`,
        sql`update public.profiles set display_name = ${name} where id = ${id}::uuid`,
      ]),
    remove: (id) =>
      run((sql) => [
        sql`update public.orders set client_id = null where client_id = ${id}::uuid`,
        sql`delete from neon_auth."user" where id = ${id}::uuid`,
      ]),
  };
}
