import type { AdvisoryFirmSummary } from '@pulse/contracts';
import {
  Button,
  Drawer,
  Message,
  SearchField,
  Select,
  VirtualList,
  type LinkRouterOptions,
  type SelectOption,
} from '@pulse/design-system';
import { formatNumber } from '@shared/format';
import type { FirmFilter, FirmsDrawerChange, FirmsDrawerState } from './firmsDrawer.url';
import { FIRM_ROW_HEIGHT, FirmRow } from './FirmRow';
import type { LoadStatus } from './firmsListing.slice';
import styles from './firms-drawer.module.scss';

export type FirmsListing = {
  status: LoadStatus;
  items: AdvisoryFirmSummary[];
  total: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  moreFailed: boolean;
};

export type FirmsDrawerProps = FirmsDrawerState & {
  listing: FirmsListing;
  options: Record<FirmFilter, SelectOption[]>;
  firmHref: (id: number) => string;
  routerOptions?: LinkRouterOptions;
  onChange: (change: FirmsDrawerChange) => void;
  onClose: () => void;
  onLoadMore: () => void;
  onRetry: () => void;
};

const ALL = 'all';

const FILTERS: { key: FirmFilter; label: string }[] = [
  { key: 'province', label: 'Provincia' },
  { key: 'specialty', label: 'Especialidad' },
];

const countOf = (total: number) =>
  total === 1 ? '1 asesoría' : `${formatNumber(total)} asesorías`;

const Results = ({
  listing,
  firmHref,
  routerOptions,
  onLoadMore,
  onRetry,
}: Pick<FirmsDrawerProps, 'listing' | 'firmHref' | 'routerOptions' | 'onLoadMore' | 'onRetry'>) => {
  if (listing.status === 'failed') {
    return (
      <Message
        tone="error"
        title="No se han podido cargar las asesorías"
        action={
          <Button variant="secondary" onPress={onRetry}>
            Reintentar
          </Button>
        }
      >
        Comprueba la conexión y vuelve a intentarlo.
      </Message>
    );
  }
  if (listing.status !== 'loaded' && listing.items.length === 0) {
    return <Message title="Cargando asesorías…" />;
  }
  return (
    <VirtualList
      label="Asesorías"
      items={listing.items.map((firm) => ({ ...firm, textValue: firm.name }))}
      rowHeight={FIRM_ROW_HEIGHT}
      href={(firm) => firmHref(firm.id)}
      routerOptions={routerOptions}
      hasMore={listing.hasMore && !listing.moreFailed}
      isLoadingMore={listing.isLoadingMore}
      onLoadMore={onLoadMore}
      emptyState={
        <Message title="Ninguna asesoría coincide">
          Prueba con otra búsqueda o quita algún filtro.
        </Message>
      }
    >
      {(firm) => <FirmRow firm={firm} />}
    </VirtualList>
  );
};

/** The advisory firms, to search and filter over any page, loaded page by page. */
export const FirmsDrawer = ({
  isOpen,
  search,
  filters,
  listing,
  options,
  onChange,
  onClose,
  onLoadMore,
  ...results
}: FirmsDrawerProps) => {
  const filtered = search !== '' || Object.values(filters).some(Boolean);
  return (
    <Drawer
      title="Asesorías"
      aside={
        listing.status === 'loaded' && <span aria-live="polite">{countOf(listing.total)}</span>
      }
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <div className={styles['firms-drawer']}>
        <SearchField
          label="Buscar asesoría"
          placeholder="Nombre de la asesoría"
          value={search}
          onChange={(value) => onChange({ search: value })}
          autoFocus
        />
        <div className={styles['firms-drawer__filters']} role="group" aria-label="Filtros">
          {FILTERS.map(({ key, label }) => (
            <Select
              key={key}
              label={label}
              options={[{ id: ALL, label: 'Todas' }, ...options[key]]}
              selectedKey={filters[key] ?? ALL}
              onSelectionChange={(value) => onChange({ [key]: value === ALL ? null : value })}
            />
          ))}
        </div>
        {filtered && (
          <div>
            <Button
              variant="secondary"
              onPress={() => onChange({ search: '', province: null, specialty: null })}
            >
              Limpiar filtros
            </Button>
          </div>
        )}
        <div
          className={styles['firms-drawer__results']}
          aria-busy={listing.status === 'loading' || listing.isLoadingMore}
        >
          <Results listing={listing} onLoadMore={onLoadMore} {...results} />
        </div>
        {listing.moreFailed && (
          <Message
            tone="error"
            title="No se han podido cargar más asesorías"
            action={
              <Button variant="secondary" onPress={onLoadMore}>
                Reintentar
              </Button>
            }
          />
        )}
      </div>
    </Drawer>
  );
};
