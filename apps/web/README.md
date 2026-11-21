# @pulse/web

Frontend of the application: a React single-page app with Redux and redux-observable, built with Vite.

Components come from the design system, and side effects live behind interfaces injected into the epics, so any feature can run without a backend in tests. In development, `/api` is proxied to the API on `localhost:3000`.
