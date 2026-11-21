import { Message, PageHeader, Panel } from '@pulse/design-system';
import { Link } from 'react-router';
import styles from './advisory-firm-detail.module.scss';

export type AdvisoryFirmDetailProps = {
  id: string;
  /** Where "Volver" goes. */
  backTo: string;
};

const SECTIONS = [
  { title: 'Datos de la asesoría', description: 'CIF, ubicación, alta, empleados y especialidad' },
  { title: 'Último mes', description: 'Los indicadores frente a hace seis meses' },
  { title: 'Evolución mensual', description: 'Clientes, facturación, impuestos y satisfacción' },
  { title: 'Mes a mes', description: 'Los valores de cada mes en una tabla' },
];

/** The detail of an advisory firm. For now, the frame of its sections. */
export const AdvisoryFirmDetail = ({ id, backTo }: AdvisoryFirmDetailProps) => (
  <div className={styles['advisory-firm-detail']}>
    <PageHeader
      title={`Asesoría ${id}`}
      back={
        <Link to={backTo} className={styles['advisory-firm-detail__back']}>
          ← Volver
        </Link>
      }
    />
    <div className={styles['advisory-firm-detail__grid']}>
      {SECTIONS.map((section) => (
        <Panel key={section.title} title={section.title} description={section.description}>
          <Message title="Pendiente">Esta sección se mostrará al montar el detalle.</Message>
        </Panel>
      ))}
    </div>
  </div>
);
