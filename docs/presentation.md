# Presenting Lodbod TQMS

Extract the complete archive. Open the folder containing frontend and mock-api in VS Code. In Terminal → New Terminal choose Command Prompt. Node.js 24 must be available. If your previous local server is still running on port 4000, stop it with Ctrl+C in its terminal.

From the project root:

    cd mock-api
    node dist/server.js

Keep this terminal open. In your browser visit http://127.0.0.1:4000. Sign in as thankot with the initial local password Thankot@2083. A changed password persists, so use the current password on subsequent runs. Server restarts require a fresh login. Each extracted copy uses its own mock-api/data directory.

## Five-minute walkthrough

1. Collapse the sidebar, then select Vehicle to open its submenu. The Lodbod logo returns home. Open the account menu and show the checkpoint profile.
2. Open Vehicle owner. Use View to inspect the Profile, Bank Details and Vehicle Details tabs. Open Vehicles → View to show documents, beneficiary, insurance, bluebook and tare weight. Use synthetic data for the demonstration.
3. Open Queue. Show the dated pending request. Review and match the existing plate BA 10 KHA 2651. Set a gross weight, review the fee preview and save. The first approval creates the journey and removes the pending request.
4. On the journey use View for the checkpoint weights and bill numbers. Use Receipt to open the separate payment/print page. Enter a second checkpoint or end the journey. The queue card links and history bill numbers open the relevant views directly.
5. Open Report → Detailed entry report and search the bill number inside its dropdown. Open Checkpoint entry to see the grouped vehicle count and amount. Finish at Generate QR.

## Source and verification

Use two terminals for development. In mock-api run npm ci and npm run dev. In frontend run npm ci and npm run dev. Open localhost:5173. Build both packages with npm run build; lint from frontend with npm run lint. Run npm test from mock-api to run the HTTP workflow with temporary local data. The packaged JavaScript and production backend dependencies are included for offline presentations.

## Receipt configuration

Before the first presentation you can set TQMS_ASSOCIATION, TQMS_PHONE and TQMS_PAN in the API terminal. Only use issuer details you are authorized to show. Phone and PAN show a dash if unset. The first entry accepts a manually supplied BS receipt date. Gregorian dates are marked AD; no automatic BS conversion is assumed. Local mock numbering and fees demonstrate the reference layout. The issuing organization must confirm its official registration, numbering and fee rules before real receipts are issued.

## Account and storage

The local assessment account is separate from the reference service. TQMS_INITIAL_PASSWORD overrides the initial password on first use; passwords are salted and hashed, login attempts are limited and sessions use HTTP-only cookies. Change password and logout invalidate the session. The app binds to loopback and is intended for local review. Photo/PDF uploads are limited to 512 KB each. Profile records and attachments persist with checkpoint.json.

Resume learning at the owner submission and persistence exercise in learning-checkpoint.md. In this revision you can follow that exercise with the owner profile and vehicle sections.
