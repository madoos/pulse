import pg from 'pg';
import { DATABASE_URL } from './environment';

/**
 * Reads the expected values straight from the database, so the tests do not trust the API
 * they are checking. Read only.
 */
export class Database {
  private readonly pool = new pg.Pool({ connectionString: DATABASE_URL, max: 2 });

  /** The fiscal years with metrics, from the oldest. */
  async fiscalYears(): Promise<number[]> {
    const { rows } = await this.pool.query<{ fiscal_year: number }>(
      'select distinct fiscal_year from monthly_metrics order by fiscal_year',
    );
    return rows.map((row) => row.fiscal_year);
  }

  /** Revenue of the network in a whole fiscal year, in euros. */
  async revenueOf(fiscalYear: number): Promise<number> {
    const { rows } = await this.pool.query<{ revenue: number }>(
      `select sum(revenue_advisory + revenue_management + revenue_consulting)::float8 / 100 as revenue
         from monthly_metrics where fiscal_year = $1`,
      [fiscalYear],
    );
    return rows[0]?.revenue ?? 0;
  }

  /** The firms whose churn in a whole fiscal year is at least `factor` times the network's. */
  async firmsWithHighChurn(fiscalYear: number, factor: number): Promise<string[]> {
    const { rows } = await this.pool.query<{ name: string }>(
      `with network as (
         select sum(churned_clients)::float8 / sum(active_clients) as churn
           from monthly_metrics where fiscal_year = $1
       )
       select f.name
         from monthly_metrics m join advisory_firms f on f.id = m.firm_id, network
        where m.fiscal_year = $1
        group by f.name, network.churn
       having sum(m.churned_clients)::float8 / sum(m.active_clients) >= $2 * network.churn
        order by f.name`,
      [fiscalYear, factor],
    );
    return rows.map((row) => row.name);
  }

  async firmIdNamed(name: string): Promise<number> {
    const { rows } = await this.pool.query<{ id: number }>(
      'select id from advisory_firms where name = $1',
      [name],
    );
    if (!rows[0]) throw new Error(`There is no advisory firm named ${name}`);
    return rows[0].id;
  }

  /** Active clients of the whole network in a month, given as "2026-03". */
  async activeClientsIn(month: string): Promise<number> {
    const { rows } = await this.pool.query<{ clients: number }>(
      `select sum(active_clients)::int as clients from monthly_metrics where month = $1::date`,
      [`${month}-01`],
    );
    return rows[0]?.clients ?? 0;
  }

  /** Revenue of the network in some calendar months (1-12) of a fiscal year, in euros. */
  async revenueOfMonths(fiscalYear: number, months: number[]): Promise<number> {
    const { rows } = await this.pool.query<{ revenue: number }>(
      `select coalesce(sum(revenue_advisory + revenue_management + revenue_consulting), 0)::float8 / 100
              as revenue
         from monthly_metrics
        where fiscal_year = $1 and extract(month from month) = any($2::int[])`,
      [fiscalYear, months],
    );
    return rows[0]?.revenue ?? 0;
  }

  async firmCount(): Promise<number> {
    const { rows } = await this.pool.query<{ count: number }>(
      'select count(*)::int as count from advisory_firms',
    );
    return rows[0]?.count ?? 0;
  }

  async specialtyCount(): Promise<number> {
    const { rows } = await this.pool.query<{ count: number }>(
      'select count(distinct specialty_code)::int as count from advisory_firms',
    );
    return rows[0]?.count ?? 0;
  }

  /** The autonomous communities that have advisory firms, by name. */
  async communitiesWithFirms(): Promise<string[]> {
    const { rows } = await this.pool.query<{ name: string }>(
      `select distinct c.name
         from advisory_firms f
         join provinces p on p.id = f.province_id
         join autonomous_communities c on c.id = p.autonomous_community_id
        order by c.name`,
    );
    return rows.map((row) => row.name);
  }

  /**
   * The firms that grow the most in active clients from one month to the same month a year
   * before, given as "2026-03" and "2025-03". Firms without data in either month are left out.
   */
  async topClientGrowth(month: string, yearBefore: string, count: number): Promise<string[]> {
    const { rows } = await this.pool.query<{ name: string }>(
      `select f.name
         from monthly_metrics now
         join monthly_metrics before on before.firm_id = now.firm_id and before.month = $2::date
         join advisory_firms f on f.id = now.firm_id
        where now.month = $1::date and before.active_clients > 0
        order by now.active_clients::float8 / before.active_clients desc, f.name
        limit $3`,
      [`${month}-01`, `${yearBefore}-01`, count],
    );
    return rows.map((row) => row.name);
  }

  /** An advisory firm with at least that many months of metrics. */
  async firmWithMonths(months: number): Promise<number> {
    const { rows } = await this.pool.query<{ id: number }>(
      `select firm_id as id from monthly_metrics group by firm_id
       having count(*) >= $1 order by firm_id limit 1`,
      [months],
    );
    if (!rows[0]) throw new Error(`No advisory firm has ${months} months of metrics`);
    return rows[0].id;
  }

  async close() {
    await this.pool.end();
  }

  /** Every firm with the basic data the listing shows, sorted by name and id. */
  async firms(): Promise<ListedFirmRow[]> {
    const { rows } = await this.pool.query<ListedFirmRow>(
      `select f.id, f.name, f.city, p.name as province, s.name as specialty, f.employees
         from advisory_firms f
         join provinces p on p.id = f.province_id
         join specialties s on s.code = f.specialty_code
        order by f.name, f.id`,
    );
    return rows;
  }
}

export type ListedFirmRow = {
  id: number;
  name: string;
  city: string;
  province: string;
  specialty: string;
  employees: number;
};
