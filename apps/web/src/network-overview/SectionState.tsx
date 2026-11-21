import { Button, Message } from '@pulse/design-system';
import type { ReactNode } from 'react';
import type { LoadStatus } from './networkOverview.slice';

export type SectionStateProps = {
  status: LoadStatus;
  /** What could not be loaded, for the error message. */
  what: string;
  onRetry: () => void;
  children: ReactNode;
};

/** Shows the section once loaded, a loading notice before, and an error with a retry. */
export const SectionState = ({ status, what, onRetry, children }: SectionStateProps) => {
  if (status === 'failed') {
    return (
      <Message
        tone="error"
        title={`No se han podido cargar ${what}`}
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
  if (status !== 'loaded') return <Message title={`Cargando ${what}…`} />;
  return children;
};
