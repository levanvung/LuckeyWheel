# Lucky Wheel for Vercel

Vòng quay nhân phẩm — lucky wheel app:
- Users enter their name before spinning.
- Each name can spin only once.
- The server generates the result and stores it in Vercel KV/Redis-compatible storage.
- Admin page displays all results.

## Deploy

1. Upload this project to GitHub.
2. Import the repository into Vercel.
3. Create a Vercel KV / Redis-compatible database and connect it to the project.
4. Add `ADMIN_PASSWORD` in Vercel Environment Variables.
5. Redeploy.

## Environment variables

- `ADMIN_PASSWORD` = password for `/admin/`
- `KV_REST_API_URL` and `KV_REST_API_TOKEN` are normally supplied automatically when using a Vercel-compatible KV/Redis integration.

## Important

The result is generated on the server, not trusted from browser JavaScript. This prevents users from simply changing the displayed result before it is saved.


## Current prizes
DIP, SMT, SMT, SMT, FINAL — each wheel segment has equal probability.
