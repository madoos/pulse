# @pulse/contracts

Shared API contracts between the backend and the frontend.

It contains the zod schemas that describe the requests and responses of the API. The backend uses them to validate requests and to generate the OpenAPI specification, and the frontend uses them for its types. Neither app depends on the other's code, only on this package.
