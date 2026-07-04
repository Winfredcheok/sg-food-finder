# SG Food Finder — web app

See the [root README](../README.md) for the full project overview.

```bash
npm run dev        # http://localhost:3000
npm run validate   # data sanity checks
npm run build && npm start
```

- `/` — main app (list + map)
- `/admin` — local-only curation form (appends to `data/entries.json` and `../seed-data.json`)
- `/api/geocode?q=<postal or address>` — OneMap geocoding proxy
