import { Button } from 'react-aria-components';
import styles from './assistant-launcher.module.scss';

export type AssistantLauncherProps = {
  label: string;
  /** A short tag next to the label, such as "Beta". */
  badge?: string;
  /** Whether the window it opens is open. */
  isExpanded: boolean;
  /** The id of the window it opens. */
  controls?: string;
  onPress: () => void;
};

/** A floating button, at the bottom right of the page, that opens an assistant. */
export const AssistantLauncher = ({
  label,
  badge,
  isExpanded,
  controls,
  onPress,
}: AssistantLauncherProps) => (
  <Button
    className={styles['assistant-launcher']}
    aria-expanded={isExpanded}
    aria-controls={isExpanded ? controls : undefined}
    onPress={onPress}
  >
    <span className={styles['assistant-launcher__icon']} aria-hidden="true">
      ✦
    </span>
    <span>{label}</span>
    {badge && (
      <>
        {' '}
        <span className={styles['assistant-launcher__badge']}>{badge}</span>
      </>
    )}
  </Button>
);
