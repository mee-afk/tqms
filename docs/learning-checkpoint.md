# Where to resume in VS Code

Start at Vehicle Owner. In the uploaded project, ownerStore.ts contained functions to read and create owners, while routes/owners.ts stopped after its imports and the previous router was commented out. The owner POST handler, form submission and end-to-end persistence were the next lesson.

## First exercise

Open Vehicle owners → Add owner. Save a synthetic record and watch the POST /api/owners request in the browser Network tab. Follow it from RecordForm in frontend/src/components/Controls.tsx to Directory.tsx, then request() in frontend/src/api.ts. On the backend, look at the group POST handler in mock-api/src/routes/operations.ts and change() in database/store.ts. Locate the ID in mock-api/data/checkpoint.json. Restart the API and search the owner's name. Explain why the record can still be found.

## Second exercise

Create a vehicle and inspect its owner value in the JSON. It stores the owner's ID. The UI looks up the current name using that ID when it renders the list. Two people can share a name and still have separate vehicle registrations.

## Third exercise

Create a queue entry, follow its POST request and compare the journey with its visits. Each check-in appends a visit. Each visit owns its bill, time, staff, weight and fee. Ending the journey changes the journey status and leaves those entries available to reports.

## Questions to practise in your own words

- Why does updating a local list in React alone lose data after a restart?
- How does a rejected form preserve the values the clerk has typed?
- What happens if two requests try to approve the same pending vehicle?
- Why does a report total change after a receipt correction?
- What has to change before a second checkpoint office can safely use a shared deployment?
