# Lykos Intelligence — Public Site

The public marketing site for Lykos Intelligence: a single self-contained `index.html` covering the hero, product roadmap, and mission, plus a full interactive product demo (pick an industry and a visual theme, then walk through Website & Leads, CRM & Pipeline, Go-to-Market Strategy, Inventory & Cash Flow, Marketing, the Intelligence Layer, and Operational Consulting against 100 simulated businesses).

## Local preview

No build step — open `index.html` directly in a browser, or serve it:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Notes

- All fonts load from Google Fonts; everything else (styles, script, demo data, logo) is inlined in the one file.
- The interactive demo's data (companies, deals, invoices, campaigns) is randomly generated client-side each load — nothing here talks to a backend.
- This repo is the public site only. It does not contain the Lykos platform application or any pricing/business documents — those are kept separately.
