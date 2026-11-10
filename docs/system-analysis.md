# System analysis

The supplied checkpoint screenshots cover a dashboard, checkpoint staff and narration, queue lists and pending requests, queue creation, entry correction, unregistered approval and matching, owner and vehicle lists and forms, other vehicles, two reports, and checkpoint QR. The attached JavaScript was a library bundle. It does not establish production endpoint contracts or transaction outcomes.

## From the reference to this implementation

| Reference evidence | Implemented workflow or design choice |
| --- | --- |
| Pending cards show vehicle, route, View and Delete | Pending table supports review, vehicle match, confirmation and removal |
| Queue list exposes In Job, In Queue, Unregistered and Payment Pending | Active/completed journey state is independent of the payment flag on each receipt. Pending requests can appear in the waiting and unregistered views. |
| New queue requires vehicle, From, To, gross weight and goods | First checkpoint creates a journey and numbered receipt together |
| Queue details show three checkpoint columns, bill numbers and End Journey | Each visit stores its own checkpoint, weight, fee, staff name, timestamp and bill. The UI lets the operator revisit and print any receipt. |
| Approval shows vehicle matching and warns about replacement | Approval consumes the pending request only after a successful save. An already-active vehicle produces a conflict, preserving the earlier record. |
| Vehicle creation references owner, association and plate information | Owner IDs link vehicles to persistent owner records; normalized duplicate plates are checked case-insensitively |
| Owner filter includes verified and unverified | Verification is stored independently of whether a journey is active |
| Staff list has status, edit and delete controls | Inactive staff cannot sign a new entry; previous receipt staff names remain readable |
| Report includes start/end dates, receipt, vehicle and goods | Summary and detailed reports use the same recorded visits, with print and spreadsheet export |
| QR page displays a download | An offline QR image contains the local checkpoint identifier; the intake form allows new pending requests |

## Decisions with incomplete production evidence

Production status transitions, card contracts, fee schedules, QR payload, calendar conversion, receipt-number sequencing and permissions were not observed end to end. The local mock permits one active journey per vehicle and one visit per checkpoint, up to three. New forms suggest Rs. 50; the operator can enter a different fee. A journey may end before the third visit. Staff can correct an active entry, and mark an unpaid receipt paid after closure.

Dates use the Gregorian calendar with Kathmandu-local reporting days. The screenshots show both BS and AD date formats. District, association and route endpoints use text fields. The mock uses a single checkpoint workspace and a small local vehicle type catalogue. Card membership, external payment settlement and production identity services require backend integration. The interface replaces the sparse reference dashboard with counts calculated from the mock records and a recent-journey register.

The responsive shell uses 768px and 1024px breakpoints. Wide tables scroll within their own containers. Labels and native select controls provide keyboard access. Consequential actions use a native modal dialog. The app provides loading feedback, empty results, validation messages and retry controls.


## November 10 reference update

The additional captures distinguish the pending approval receipt preview, the CP1–CP3 history with bill links, and the vehicle weighing/payment receipt. The queue now separates these views. Receipt numbers and checkpoint bill numbers are stored separately for new entries. Existing records without a numeric receipt number retain their original bill identifier. The sidebar, account pages, owner profile and vehicle profile sections follow the additional references. Updated report filters offer in-menu search. The QR page contains the checkpoint code and download.

Manual BS entry is available on first entry. A local issuer can supply PAN, telephone and association details using the environment settings in presentation.md. Plate components, district and bank catalogue values accept text because the reference screenshots do not provide complete official option catalogues. The test fixture uses synthetic names and a local-only checkpoint account.

Checked: frontend/backend TypeScript, frontend ESLint, packaged start and sign-in page, 36 HTTP checks plus persistence, cross-origin checks and password/session invalidation. Each profile tab shares the same form/storage implementation; the tests exercise representative bank and tare-weight edits.
