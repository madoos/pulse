import type { ReactNode } from 'react';
import {
  GridList,
  GridListItem,
  GridListLoadMoreItem,
  ListLayout,
  Virtualizer,
} from 'react-aria-components';
import type { LinkRouterOptions } from '../link-router';
import styles from './virtual-list.module.scss';

export type VirtualListItem = { id: string | number; textValue: string };

export type VirtualListProps<T extends VirtualListItem> = {
  /** Accessible name of the list. */
  label: string;
  items: T[];
  /** Every row has this height in pixels, so rows can be placed without rendering them. */
  rowHeight: number;
  children: (item: T) => ReactNode;
  /** Makes each row a link, for example to the detail of the item. */
  href?: (item: T) => string;
  routerOptions?: LinkRouterOptions;
  /** Whether there are more items to load after the last one. */
  hasMore?: boolean;
  isLoadingMore?: boolean;
  /** Asks for the next items when the end of the list comes into view. */
  onLoadMore?: () => void;
  /** Shown when there are no items. */
  emptyState?: ReactNode;
};

const LOADER_HEIGHT = 48;

/**
 * A long list that only renders the rows in view. When the end of the list comes into
 * view it asks for more, so the items can be loaded page by page as the user scrolls.
 */
export const VirtualList = <T extends VirtualListItem>({
  label,
  items,
  rowHeight,
  children,
  href,
  routerOptions,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  emptyState,
}: VirtualListProps<T>) => (
  <Virtualizer
    layout={ListLayout}
    layoutOptions={{ rowSize: rowHeight, loaderSize: LOADER_HEIGHT }}
  >
    <GridList
      aria-label={label}
      className={styles['virtual-list']}
      layout="stack"
      renderEmptyState={() => <div className={styles['virtual-list__empty']}>{emptyState}</div>}
    >
      {items.map((item) => (
        <GridListItem
          key={item.id}
          id={item.id}
          textValue={item.textValue}
          href={href?.(item)}
          routerOptions={routerOptions}
          className={styles['virtual-list__item']}
        >
          {children(item)}
        </GridListItem>
      ))}
      {hasMore && (
        <GridListLoadMoreItem
          className={styles['virtual-list__loader']}
          isLoading={isLoadingMore}
          onLoadMore={onLoadMore}
        >
          <span role="status">Cargando más…</span>
        </GridListLoadMoreItem>
      )}
    </GridList>
  </Virtualizer>
);
