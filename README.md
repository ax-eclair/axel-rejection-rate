# Axel Rejection Rate

A bilingual dashboard of Axel’s 2026 job search. It combines application records from Gmail and Google Drive, deduplicates company/role pairs, and shows outcomes and interview invitations over time.

[Open the GitHub Pages dashboard](https://ax-eclair.github.io/axel-rejection-rate/dist/)

The FR / EN switch at the top remembers the selected language. The original private Sites deployment is separate from this GitHub Pages version.

## Run locally

Requires Python 3. No package installation or build step is needed.

```sh
python3 -m http.server 8766 --bind 127.0.0.1 --directory dist
```

Open <http://127.0.0.1:8766/>. Use an HTTP server rather than opening `index.html` directly, because the dashboard fetches `data.json`.

## Files

- `dist/index.html`: page structure.
- `dist/style.css`: desktop and mobile styles.
- `dist/app.js`: filtering, charts, detail views and CSV export.
- `dist/i18n.js`: French/English translations and saved language preference.
- `dist/data.json`: application records, events, notes and source links.
- `.openai/hosting.json`: the existing Sites project identity and static directory.

## Data and counting

Gmail data was updated through **28 October 2026**; Drive records were last collected on **16 October 2026**. This is a snapshot, not a live integration. The main view includes 91 email-confirmed applications; the expanded view includes 19 additional Drive-only records requiring verification. HMBotel / DigiHMB is excluded.

The latest update records 59 rejections, 17 interview stages unlocked across 9 hiring processes, and one offer. Talon.One and heyData add two direct rejections; the Talon.One rejection also confirms a previously unverified application. GLS/NXT adds a first phone-interview invitation. Voyfai is a voluntary withdrawal, with three interviews completed and four stages unlocked. ROMEO / erasys remains one offer, with the contract signed on 21 October.

Applications are grouped by company and role. Different roles remain separate. Interview invitations and completed interviews are counted separately. Missing responses are not treated as rejections. The dashboard includes the full methodology and source links.

## Publish updates

GitHub Pages publishes the **main** branch from **/ (root)**. Updating `dist/` on `main` triggers publication. The dashboard URL ends in **/dist/** because that is where `index.html` lives.

The original private Sites deployment requires a separate update through Codex with the Sites plugin:

1. Ask Codex to update the existing Site using the repository’s changes.
2. Keep the project ID in `.openai/hosting.json` and the current private audience.
3. Have Codex validate the change, synchronize the Site source, package `dist/`, and publish the resulting version.

Updating GitHub Pages does not update the separate Sites deployment.

## Privacy

This repository and its GitHub Pages deployment are public. `dist/data.json` contains application history and Gmail/Drive source links; access to the linked originals still depends on the viewer’s permissions. Email bodies, contract files and signing links are not included in the dashboard.

## Basic validation

With Node.js installed:

```sh
node --check dist/app.js
node --check dist/i18n.js
```

Then preview the page locally and check both languages, filters, date ranges and application details.
