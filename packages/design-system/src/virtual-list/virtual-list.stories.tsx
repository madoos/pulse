import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { VirtualList } from '.';

const PAGE = 30;
const TOTAL = 5000;

const firm = (i: number) => ({ id: i, textValue: `Asesoría ${String(i).padStart(4, '0')}` });

/** Loads 30 items at a time, as the listing does from the API, up to 5,000. */
const PagedList = () => {
  const [items, setItems] = useState(() => Array.from({ length: PAGE }, (_, i) => firm(i + 1)));
  const [isLoadingMore, setLoadingMore] = useState(false);
  const loadMore = () => {
    if (isLoadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setItems((current) => [
        ...current,
        ...Array.from({ length: PAGE }, (_, i) => firm(current.length + i + 1)),
      ]);
      setLoadingMore(false);
    }, 500);
  };
  return (
    <div style={{ height: 400 }}>
      <VirtualList
        label="Asesorías"
        items={items}
        rowHeight={48}
        hasMore={items.length < TOTAL}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
      >
        {(item) => item.textValue}
      </VirtualList>
    </div>
  );
};

const meta = {
  title: 'Components/VirtualList',
  component: VirtualList,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof VirtualList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PagedLoading: Story = {
  args: { label: 'Asesorías', items: [], rowHeight: 48, children: () => null },
  render: () => <PagedList />,
};

export const Empty: Story = {
  args: {
    label: 'Asesorías',
    items: [],
    rowHeight: 48,
    emptyState: 'Ninguna asesoría coincide con la búsqueda',
    children: () => null,
  },
};
