import type { AdvisoryFirm } from '@pulse/contracts';
import { formatDate, formatNumber } from '@shared/format';
import styles from './advisory-firm-detail.module.scss';

/** The basic data of an advisory firm. */
export const FirmProfile = ({ firm }: { firm: AdvisoryFirm }) => {
  const fields: [string, string][] = [
    ['CIF', firm.taxId],
    ['Provincia', firm.province],
    ['Ciudad', firm.city],
    ['Alta', formatDate(firm.onboardedOn)],
    ['Empleados', formatNumber(firm.employees)],
    ['Especialidad', firm.specialty],
  ];
  return (
    <dl className={styles['advisory-firm-detail__profile']}>
      {fields.map(([label, value]) => (
        <div key={label} className={styles['advisory-firm-detail__field']}>
          <dt className={styles['advisory-firm-detail__label']}>{label}</dt>
          <dd className={styles['advisory-firm-detail__value']}>{value}</dd>
        </div>
      ))}
    </dl>
  );
};
