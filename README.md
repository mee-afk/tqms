# Lodbod TQMS

A checkpoint clerk can register a vehicle and its owner, record a load, weigh it at successive checkpoints, issue receipts, and reconcile the entries through reports. The React client talks to a separate Express API. All records belong to the local assessment application.

## Run the presentation

Extract the ZIP and open the project root in VS Code. Open a Command Prompt terminal, run `cd mock-api` then `node dist/server.js`. Use Node.js 24. Visit http://127.0.0.1:4000 and sign in as **thankot** with the initial password **Thankot@2083**. The packaged app includes its runtime dependencies. The complete walkthrough and issuer configuration are in [docs/presentation.md](docs/presentation.md).

## Develop in VS Code

Use two Command Prompt terminals from the extracted project root. Stop the presentation server first to free port 4000.

Backend:
```bat
cd mock-api
npm ci
npm run build
npm run dev
```

Frontend:
```bat
cd frontend
npm ci
npm run lint
npm run build
npm run dev
```

Open the URL printed by Vite, normally http://localhost:5173. Vite forwards /api requests to port 4000. The production launcher serves the compiled frontend and API on the same origin. After editing the source, build both packages before presenting again.

## Demonstrate the workflow

1. Open Vehicle owners. Add an owner with a name, state, district and phone. Select an owner category and verification status. Optional logo and registration document uploads accept PNG/JPEG and, for registration documents, PDF. Limit 512 KB each.
2. Open Vehicles. Add a plate, choose the owner, choose a vehicle type and fill out the starred fields.
3. Choose Add new queue. Select that vehicle, enter the start, destination, load and weight, select the checkpoint and staff, and save. The journey view opens with its first receipt.
4. Choose Check in, record a second checkpoint and gross weight. Click a bill number in the history to switch receipts. Use Edit entry for a weight or fee correction while the journey is active.
5. Choose End journey and confirm. Open Reports → Detailed entries, filter by vehicle or receipt and export. Excel opens the exported SpreadsheetML XML workbook. Checkpoint entry reports group records by local date, checkpoint and staff.
6. For an approval demonstration, open Queue → Review on a pending request, choose the matching registered vehicle and save. Queue → Pending request adds another waiting request. The QR PNG encodes this local checkpoint identifier.
7. Select Pending in a new checkpoint entry's payment field to test the Payment Pending filter. Select the receipt and Record payment once the fee has been received.

## Project structure

| Location | Responsibility |
| --- | --- |
| frontend/src/App.tsx | App layout, responsive navigation and routes |
| frontend/src/pages/Directory.tsx | Search, sort, filter, paginate, create, edit and view directory records |
| frontend/src/pages/Journeys.tsx | Pending approval, check-in, receipts, fee corrections and journey completion |
| frontend/src/pages/Reports.tsx | Date and record filters, grouping, printing and Excel export |
| frontend/src/components/Controls.tsx | Accessible form labels, confirmation dialogs and shared tables |
| frontend/src/api.ts | HTTP client, response parsing and field errors |
| mock-api/src/routes/operations.ts | HTTP endpoints, validation and status rules |
| mock-api/src/database/store.ts | Seed data and atomic file replacement |
| shared/model.ts | Data contracts and form fields; mirror field changes in both packages' src/model.ts |
| docs | System analysis, screenshots, learning checkpoint |

## API

Successful reads and writes use a data property; creates return 201 and deletes return 204. Errors contain error.message and, where applicable, error.fields. The UI reads a small combined checkpoint snapshot at /api/state and caches it for 15 seconds. A successful mutation invalidates the snapshot. Owner file contents are excluded from the snapshot. This design suits the size of the local mock. Large deployments should use paged queries per screen.

| Method | Path | Use |
| --- | --- | --- |
| GET | /api/health, /api/state | Availability and current workspace |
| GET | /api/{group} | Group rows; q, status, page and limit parameters |
| GET, PUT | /api/{group}/{id} | Detail and update |
| POST | /api/{group} | Create a record |
| GET | /api/owners/{id}/files/{logo or document} | Download an attachment |
| DELETE | /api/staff/{id} | Remove a staff record |
| POST, DELETE | /api/pending, /api/pending/{id} | Submit or withdraw a pending request |
| POST | /api/journeys | Create journey; optionally consume pendingId |
| POST | /api/journeys/{id}/check-in, /api/journeys/{id}/end | Append checkpoint or close journey |
| PATCH | /api/journeys/{id}/receipt/{visit} | Correct weight or fee |
| POST | /api/journeys/{id}/pay/{visit} | Mark fee paid |

Groups: owners, vehicles, others, staff, narrations. Example first entry with a seeded available vehicle:
```json
{"vehicle":"v5","from":"Banepa","to":"Butwal","material":"Timber","checkpoint":"Thankot","staff":"s1","weight":9200,"fee":50,"payment":"Paid"}
```

## Verification

From mock-api, run npm test. It starts a separate server with temporary records, exercises registration, validation, pending approval, check-in, payment, editing, ending a journey, staff changes and restart persistence. It also checks cross-origin rejection, malformed JSON and direct navigation. Run npm run build before testing changed server code.

To check loading and error recovery set TQMS_DELAY_MS=1000 or TQMS_FAIL_READ=1 in the backend terminal before starting the API. The delay is capped at 3000 ms. Clear the variable and restart to restore normal operation. PORT and TQMS_DATA_DIR are optional overrides.

The initial delivery passed TypeScript for both packages, frontend lint and the HTTP workflow checks. In Chromium a journey was created through the form, its receipt displayed, and the detail report opened. The responsive dashboard and mobile menu were visually checked at 412 px. The revised packaged sign-in page is shown in docs/revision/sign-in.png.

## Operating scope

This is a local checkpoint assessment using synthetic records. The server binds to loopback, restricts hosts and mutation origins, validates proposed changes, limits JSON and attachment sizes, and serves attachment downloads with explicit content types. A public installation needs individual accounts, role-based authorization, durable multi-user storage, upload scanning and an audit trail. Production credentials and production data are outside the project.
