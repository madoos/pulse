import type { AdvisoryFirmSummary } from '@pulse/contracts';
import { Badge } from '@pulse/design-system';
import { formatNumber } from '@shared/format';
import styles from './firm-row.module.scss';

/** Height of a row of the listing, in pixels: the list places rows without rendering them. */
export const FIRM_ROW_HEIGHT = 64;

const employeesOf = (employees: number) =>
  employees === 1 ? '1 empleado' : `${formatNumber(employees)} empleados`;

/** An advisory firm in the listing: name, where it is, how many people and what it does. */
export const FirmRow = ({ firm }: { firm: AdvisoryFirmSummary }) => (
  <div className={styles['firm-row']}>
    <div className={styles['firm-row__main']}>
      <span className={styles['firm-row__name']}>{firm.name}</span>
      <span className={styles['firm-row__meta']}>
        {firm.city} · {firm.province}
      </span>
    </div>
    <div className={styles['firm-row__aside']}>
      <Badge>{firm.specialty}</Badge>
      <span className={styles['firm-row__meta']}>{employeesOf(firm.employees)}</span>
    </div>
  </div>
);
