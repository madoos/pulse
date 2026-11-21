import type { ReactNode } from 'react';
import {
  Cell,
  Column,
  Row,
  Table as AriaTable,
  TableBody,
  TableHeader,
  type SortDescriptor,
} from 'react-aria-components';
import styles from './table.module.scss';

export type TableColumn = {
  id: string;
  label: string;
  /** The column that names each row. */
  isRowHeader?: boolean;
  allowsSorting?: boolean;
  /** Numbers align to the end. */
  align?: 'start' | 'end';
};

export type TableRow = { id: string; cells: Record<string, ReactNode> };

export type TableSort = { column: string; direction: 'ascending' | 'descending' };

export type TableProps = {
  label: string;
  columns: TableColumn[];
  rows: TableRow[];
  /** The rows arrive sorted: the table only shows and changes the sort. */
  sort?: TableSort;
  onSortChange?: (sort: TableSort) => void;
};

export const Table = ({ label, columns, rows, sort, onSortChange }: TableProps) => {
  const alignOf = (columnId: string) =>
    columns.find((c) => c.id === columnId)?.align === 'end' ? styles['table__cell--end'] : '';

  return (
    <div className={styles.table__scroll}>
      <AriaTable
        aria-label={label}
        className={styles.table}
        sortDescriptor={sort && { column: sort.column, direction: sort.direction }}
        onSortChange={(descriptor: SortDescriptor) =>
          onSortChange?.({ column: String(descriptor.column), direction: descriptor.direction })
        }
      >
        <TableHeader columns={columns}>
          {(column) => (
            <Column
              id={column.id}
              isRowHeader={column.isRowHeader}
              allowsSorting={column.allowsSorting}
              className={`${styles.table__column} ${alignOf(column.id)}`}
            >
              {({ allowsSorting, sortDirection }) => (
                <span className={styles['table__column-label']}>
                  {column.label}
                  {allowsSorting && (
                    <span className={styles['table__sort']} aria-hidden="true">
                      {sortDirection === 'ascending' && '▲'}
                      {sortDirection === 'descending' && '▼'}
                    </span>
                  )}
                </span>
              )}
            </Column>
          )}
        </TableHeader>
        <TableBody items={rows}>
          {(row) => (
            <Row id={row.id} columns={columns} className={styles.table__row}>
              {(column) => (
                <Cell className={`${styles.table__cell} ${alignOf(column.id)}`}>
                  {row.cells[column.id]}
                </Cell>
              )}
            </Row>
          )}
        </TableBody>
      </AriaTable>
    </div>
  );
};
