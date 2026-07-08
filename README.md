# wemojema-apps-admin

Admin control panel for the wemojema ecosystem — register/manage wemojema-auth tenants and
automate the tenant-auth setup that's otherwise run by hand through `org-control`.

Deployed in the **WemojemaAuth** account. The app is itself a wemojema-auth tenant:

```
admin.wemojema.com (React SPA, S3+CloudFront)
   └─ login (PKCE) ─▶ admin.auth.wemojema.com   (the auth server; client "admin-web")
Admin API (Micronaut Lambda + API Gateway)  — @WemojemaSecured via wemojema-auth-sdk
   │  (WEMOJEMA_AUTH_HOST=admin.auth.wemojema.com → only admin-tenant users pass = admins)
   ├─ wemojema-auth-tenants table (read) + wemojema-auth-admin SQS queue (UPSERT/DELETE_TENANT)
   ├─ SES: DKIM/verification + account sandbox status
   └─ invoke org-control (cross-account) — CREATE_AUTH_CNAME, PROVISION_TENANT_EMAIL   [Slice 2]
```

**Authorization = tenant isolation:** only admins have accounts in the `admin.auth.wemojema.com`
tenant, so any authenticated user of that tenant is an admin.

## Layout

- `backend/` — Micronaut Java 21 Lambda admin API (dogfoods `wemojema-auth-sdk`)
- `frontend/` — React + Vite + TS + Tailwind SPA (inline PKCE for now)

## Backend API (Slice 1 — done)

All endpoints require a valid admin-tenant token (`@WemojemaSecured`).

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/tenants` | List tenants |
| GET | `/api/v1/tenants/{id}` | Get one tenant |
| PUT | `/api/v1/tenants/{id}` | Register/update (UPSERT_TENANT via admin queue) |
| DELETE | `/api/v1/tenants/{id}` | Delete (DELETE_TENANT via admin queue) |
| GET | `/api/v1/tenants/{id}/status` | Tenant sender-domain DKIM + verification status |
| GET | `/api/v1/account/ses` | SES account sandbox vs production + send quota |

Config (env): `WEMOJEMA_AUTH_HOST`, `TENANTS_TABLE`, `ADMIN_QUEUE_URL`.

Build: `cd backend && ./gradlew build` (needs `wemojema-auth-sdk` in mavenLocal —
`publishToMavenLocal` from that repo first).

## Roadmap

- **Slice 1:** Tenant CRUD + status API ✅ · frontend (list/detail/edit, status, copy snippet) — next
- **Slice 2:** DNS + email automation (invoke `org-control` `CREATE_AUTH_CNAME` / `PROVISION_TENANT_EMAIL`)
- **Infra:** `cloud-formation.yml` (Lambda + API GW + S3/CloudFront + roles + org-control invoke permission)
- **Bootstrap:** register the `admin.auth.wemojema.com` tenant, cert/DNS for `admin.wemojema.com`, first admin user
