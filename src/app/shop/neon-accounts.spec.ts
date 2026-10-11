import { neonAccountDirectory } from './neon-accounts';
import type { AccountSql, SqlStatement } from './neon-accounts';

/** Records what the directory would send to Postgres, without a database. */
function recordingSql(): { sql: AccountSql; transactions: string[][] } {
  const transactions: string[][] = [];
  const tag = (strings: TemplateStringsArray, ...values: unknown[]): SqlStatement => ({
    text: strings.reduce(
      (text, part, index) => text + part + (index < values.length ? `$${index + 1}` : ''),
      '',
    ),
    values,
  });
  const sql = Object.assign(tag, {
    transaction: async (statements: SqlStatement[]) => {
      transactions.push(statements.map((statement) => statement.text.replace(/\s+/g, ' ').trim()));
    },
  });
  return { sql: sql as AccountSql, transactions };
}

describe('Neon account directory', () => {
  it('is absent when the shop runs without a database', () => {
    expect(neonAccountDirectory(undefined)).toBeNull();
    expect(neonAccountDirectory('')).toBeNull();
  });

  it('renames the account and its profile together', async () => {
    const { sql, transactions } = recordingSql();
    const directory = neonAccountDirectory('postgres://test', async () => sql);

    await directory?.rename('5b0e1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d', 'Ada King');

    expect(transactions).toEqual([
      [
        'update neon_auth."user" set name = $1, "updatedAt" = now() where id = $2::uuid',
        'update public.profiles set display_name = $1 where id = $2::uuid',
      ],
    ]);
  });

  it('unlinks the orders before removing the account, in one transaction', async () => {
    const { sql, transactions } = recordingSql();
    const directory = neonAccountDirectory('postgres://test', async () => sql);

    await directory?.remove('5b0e1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d');

    expect(transactions).toEqual([
      [
        'update public.orders set client_id = null where client_id = $1::uuid',
        'delete from neon_auth."user" where id = $1::uuid',
      ],
    ]);
  });
});
