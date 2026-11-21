import type { Location } from 'react-router';

/** Where a detail page was opened from, so "Volver" returns there with its filters. */
export type FromState = { from?: string };

export const firmPath = (id: number) => `/advisory-firms/${id}`;

export const fromState = ({
  pathname,
  search,
}: Pick<Location, 'pathname' | 'search'>): FromState => ({
  from: `${pathname}${search}`,
});

/** Where "Volver" goes: the page the detail was opened from, or the network overview. */
export const backHref = (state: unknown) => {
  const from = (state as FromState | null)?.from;
  return from?.startsWith('/') ? from : '/';
};
