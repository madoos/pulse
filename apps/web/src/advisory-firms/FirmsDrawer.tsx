import { Button, Drawer, Message, SearchField, Select } from '@pulse/design-system';
import type { FirmFilter, FirmsDrawerChange, FirmsDrawerState } from './firmsDrawer.url';
import styles from './firms-drawer.module.scss';

export type FirmsDrawerProps = FirmsDrawerState & {
  onChange: (change: FirmsDrawerChange) => void;
  onClose: () => void;
};

const ALL = 'all';

const FILTERS: { key: FirmFilter; label: string }[] = [
  { key: 'specialty', label: 'Especialidad' },
  { key: 'community', label: 'Comunidad autónoma' },
  { key: 'size', label: 'Tamaño' },
];

/** The advisory firms, to search and filter over any page. The listing itself comes next. */
export const FirmsDrawer = ({ isOpen, search, filters, onChange, onClose }: FirmsDrawerProps) => {
  const filtered = search !== '' || Object.values(filters).some(Boolean);
  return (
    <Drawer title="Asesorías" isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <div className={styles['firms-drawer']}>
        <SearchField
          label="Buscar asesoría"
          placeholder="Nombre, ciudad o CIF"
          value={search}
          onChange={(value) => onChange({ search: value })}
          autoFocus
        />
        <div className={styles['firms-drawer__filters']} role="group" aria-label="Filtros">
          {FILTERS.map(({ key, label }) => (
            <Select
              key={key}
              label={label}
              // The options will come from the data, with the listing.
              options={[{ id: ALL, label: 'Todas' }]}
              selectedKey={filters[key] ?? ALL}
              onSelectionChange={(value) => onChange({ [key]: value === ALL ? null : value })}
            />
          ))}
        </div>
        {filtered && (
          <div>
            <Button
              variant="secondary"
              onPress={() => onChange({ search: '', specialty: null, community: null, size: null })}
            >
              Limpiar filtros
            </Button>
          </div>
        )}
        <Message title="El listado de asesorías llegará pronto">
          Aquí aparecerán las asesorías que cumplan la búsqueda y los filtros.
        </Message>
      </div>
    </Drawer>
  );
};
