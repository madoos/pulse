import type { ReactNode } from 'react';
import { RouterProvider } from 'react-aria-components';

/** Options a link passes to the router, such as the state of the new history entry. */
export type LinkRouterOptions = { state?: unknown };

declare module 'react-aria-components' {
  interface RouterConfig {
    routerOptions: LinkRouterOptions;
  }
}

export type LinkRouterProps = {
  /** Navigates inside the application, for example the `navigate` of the router. */
  navigate: (href: string, options?: LinkRouterOptions) => void;
  /** Turns an application path into a real href, for example the `useHref` of the router. */
  useHref?: (href: string) => string;
  children: ReactNode;
};

/** Makes the links of the design system navigate with the router of the application. */
export const LinkRouter = ({ navigate, useHref, children }: LinkRouterProps) => (
  <RouterProvider navigate={navigate} useHref={useHref}>
    {children}
  </RouterProvider>
);
