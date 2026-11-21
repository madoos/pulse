import type { ReactNode } from 'react';
import { Button, Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';
import styles from './drawer.module.scss';

export type DrawerProps = {
  title: string;
  /** Shown next to the title, for example a counter. */
  aside?: ReactNode;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  children: ReactNode;
};

/** A panel that slides in from the right over the page, for example to browse a list. */
export const Drawer = ({ title, aside, isOpen, onOpenChange, children }: DrawerProps) => (
  <ModalOverlay
    className={styles.drawer__overlay}
    isOpen={isOpen}
    onOpenChange={onOpenChange}
    isDismissable
  >
    <Modal className={styles.drawer}>
      <Dialog className={styles.drawer__dialog}>
        <header className={styles.drawer__header}>
          <Heading slot="title" className={styles.drawer__title}>
            {title}
          </Heading>
          {aside && <span className={styles.drawer__aside}>{aside}</span>}
          <Button slot="close" className={styles.drawer__close} aria-label="Cerrar">
            <span aria-hidden="true">✕</span>
          </Button>
        </header>
        <div className={styles.drawer__body}>{children}</div>
      </Dialog>
    </Modal>
  </ModalOverlay>
);
