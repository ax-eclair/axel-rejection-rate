# Axel Rejection Rate

A private, bilingual dashboard of Axel’s 2026 job search. It combines application records from Gmail and Google Drive, deduplicates company/role pairs, and shows outcomes and interview invitations over time.

[Open the hosted dashboard](https://axel-rejection-rate.axelg2000.chatgpt.site/)

The hosted site currently requires the owner’s ChatGPT account. The FR / EN switch at the top remembers the selected language.

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

The data is a snapshot as of **16 October 2026**, not a live Gmail or Drive integration. The main view includes 90 email-confirmed applications; the expanded view includes 20 additional Drive-only records requiring verification. HMBotel / DigiHMB is excluded.

Applications are grouped by company and role. Different roles remain separate. Interview invitations and completed interviews are counted separately. Missing responses are not treated as rejections. The dashboard includes the full methodology and source links.

## Publish updates

This repository stores the source. The existing website is hosted with **Sites**, separately from GitHub. Pushing a commit here does not automatically deploy it; no GitHub Actions deployment or GitHub Pages publication is configured.

To publish an update through Codex with the Sites plugin:

1. Ask Codex to update the existing Site using the repository’s changes.
2. Keep the project ID in `.openai/hosting.json` and the current private audience.
3. Have Codex validate the change, synchronize the Site source, package `dist/`, and publish the resulting version.

The app can also be served by a static web host. Before migrating, configure access control for the **whole site, including `data.json`**.

## Privacy

Keep this repository private: `dist/data.json` contains personal application history and Gmail/Drive source links. A private repository does not, by itself, make a deployed website private.

For a public demo, create a separate copy with synthetic or anonymized data and remove personal source links and the existing Sites project identity before publishing. Do not expose this repository’s history as a public demo.

## Basic validation

With Node.js installed:

```sh
node --check dist/app.js
node --check dist/i18n.js
```

Then preview the page locally and check both languages, filters, date ranges and application details.
