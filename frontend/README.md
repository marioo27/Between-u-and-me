# Between U & Me — frontend

Angular 22 app for [Between U & Me](../README.md).

## Run

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200).

## Scripts

```bash
npm start      # ng serve
npm run build  # production build → dist/between-u-and-me/browser
npm test       # Vitest unit tests
```

## Notes

- Games: `/` home catalog, `/nhie` Never Have I Ever, `/impostor` The Impostor.
- Language + help live in the header **settings menu** (`shared/site-menu`).
- Prompt / word banks in `public/data/` (`yo-nunca.json`, `nhie.json`, `impostor-es.json`, `impostor-en.json`).
- SPA redirects for Netlify: `public/_redirects`.
- Full project docs (EN + ES): [root README](../README.md).
