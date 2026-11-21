import { FirmsDrawer } from './FirmsDrawer';
import { useFirmsDrawer } from './firmsDrawer.url';

export const FirmsDrawerContainer = () => {
  const { isOpen, search, filters, change, close } = useFirmsDrawer();
  return (
    <FirmsDrawer
      isOpen={isOpen}
      search={search}
      filters={filters}
      onChange={change}
      onClose={close}
    />
  );
};
