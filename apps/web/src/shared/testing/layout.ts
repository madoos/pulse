import { afterAll, beforeAll, vi } from 'vitest';

/**
 * jsdom has no layout: virtual lists see no room and render no rows, and nothing ever
 * scrolls into view. This gives every element a viewport and lets a test say when the
 * end of a list comes into view.
 */
export const useListViewport = ({ height = 400, width = 400 } = {}) => {
  let callbacks: IntersectionObserverCallback[] = [];

  beforeAll(() => {
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => height);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          callbacks.push(callback);
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
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  return {
    endComesIntoView: () => {
      const current = callbacks;
      callbacks = [];
      for (const callback of current) {
        callback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        );
      }
    },
  };
};
