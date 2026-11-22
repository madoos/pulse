import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { VirtualList } from '.';
import { LinkRouter } from '../link-router';

const ROW = 40;
const VIEWPORT = 200;

const items = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  textValue: `Asesoría ${i + 1}`,
}));

// jsdom has no layout: the list is given a viewport so the virtualizer has room to fill.
const sizes = [
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => VIEWPORT),
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 400),
];

let intersections: IntersectionObserverCallback[] = [];

beforeAll(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: IntersectionObserverCallback) {
        intersections.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
});

afterAll(() => {
  for (const size of sizes) size.mockRestore();
  vi.unstubAllGlobals();
});

const comesIntoView = () =>
  intersections.forEach((callback) =>
    callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver),
  );

const renderList = (props: Partial<Parameters<typeof VirtualList>[0]> = {}) =>
  render(
    <VirtualList label="Asesorías" items={items} rowHeight={ROW} {...props}>
      {(item) => <span>{item.textValue}</span>}
    </VirtualList>,
  );

describe('VirtualList', () => {
  it('renders only the rows in view, not every item', () => {
    renderList();

    const rows = within(screen.getByRole('grid', { name: 'Asesorías' })).getAllByRole('row');
    expect(rows[0]).toHaveTextContent('Asesoría 1');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(50);
  });

  it('asks for more when the end of the list comes into view', () => {
    intersections = [];
    const onLoadMore = vi.fn();
    renderList({ items: items.slice(0, 3), hasMore: true, onLoadMore });

    comesIntoView();

    expect(onLoadMore).toHaveBeenCalled();
  });

  it('announces that it is loading more', () => {
    renderList({ items: items.slice(0, 3), hasMore: true, isLoadingMore: true });

    expect(screen.getByRole('status')).toHaveTextContent('Cargando más…');
  });

  it('shows the empty state when there are no items', () => {
    renderList({ items: [], emptyState: 'No hay asesorías' });

    expect(screen.getByRole('grid')).toHaveTextContent('No hay asesorías');
  });

  it('navigates with the router when a row is a link', async () => {
    const navigate = vi.fn();
    render(
      <LinkRouter navigate={navigate}>
        <VirtualList
          label="Asesorías"
          items={items.slice(0, 3)}
          rowHeight={ROW}
          href={(item) => `/advisory-firms/${item.id}`}
          routerOptions={{ state: { from: '/' } }}
        >
          {(item) => <span>{item.textValue}</span>}
        </VirtualList>
      </LinkRouter>,
    );

    await userEvent.click(screen.getByText('Asesoría 2'));

    expect(navigate).toHaveBeenCalledWith('/advisory-firms/2', { state: { from: '/' } });
  });

  it('has no accessibility violations', async () => {
    const { container } = renderList({ items: items.slice(0, 3) });

    expect((await axe.run(container)).violations).toEqual([]);
  });
});
