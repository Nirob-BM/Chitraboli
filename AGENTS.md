# Project architecture rules

- The administrator interface uses the protected `/localhost-69` client route; keep all admin navigation and role-based redirects aligned with it so access remains consistent.
- Keep lazy page imports centralized in `src/lib/routePreload.ts` so navigation intent can preload the same route chunks without duplicating loaders.