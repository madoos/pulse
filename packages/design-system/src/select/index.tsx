import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValue,
  type Key,
} from 'react-aria-components';
import styles from './select.module.scss';

export type SelectOption = { id: string; label: string };

export type SelectProps = {
  label: string;
  options: SelectOption[];
  selectedKey: string | null;
  onSelectionChange: (key: string) => void;
  isDisabled?: boolean;
};

export const Select = ({
  label,
  options,
  selectedKey,
  onSelectionChange,
  isDisabled,
}: SelectProps) => (
  <AriaSelect
    className={styles.select}
    selectedKey={selectedKey}
    onSelectionChange={(key: Key | null) => {
      if (key !== null) onSelectionChange(String(key));
    }}
    isDisabled={isDisabled}
  >
    <Label className={styles.select__label}>{label}</Label>
    <Button className={styles.select__button}>
      <SelectValue className={styles.select__value} />
      <span className={styles.select__chevron} aria-hidden="true">
        ▾
      </span>
    </Button>
    <Popover className={styles.select__popover}>
      <ListBox className={styles.select__list} items={options}>
        {(option) => (
          <ListBoxItem id={option.id} className={styles.select__option}>
            {option.label}
          </ListBoxItem>
        )}
      </ListBox>
    </Popover>
  </AriaSelect>
);
