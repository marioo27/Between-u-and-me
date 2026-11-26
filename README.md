# Between U & Me

<p align="left">
  <img src="https://img.shields.io/badge/Angular-22-DD0031?style=for-the-badge&logo=angular&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white"/>
  <img src="https://img.shields.io/badge/Vitest-Tests-6E9F18?style=for-the-badge&logo=vitest&logoColor=white"/>
  <img src="https://img.shields.io/badge/Deploy-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white"/>
  <img src="https://img.shields.io/badge/License-MIT-2ea44f?style=for-the-badge"/>
</p>

**Live app:** [https://between-u-and-me.netlify.app](https://between-u-and-me.netlify.app)  
**API:** [https://i-aint-ur-fan.onrender.com](https://i-aint-ur-fan.onrender.com) · health: [`/api/health`](https://i-aint-ur-fan.onrender.com/api/health)

[English](#english) · [Español](#espanol)

---

<a id="english"></a>

## English

**Public web app** | **Party games for friends** | **No login · No database**

Between U & Me is a small vault of games for your friend group. Games today:

- **Never Have I Ever** / **Yo Nunca** — random prompts, category filters, no repeats until the deck is spent.
- **The Impostor** — pass-the-phone roles: civilians see a secret word; impostors see a hint, the category, or nothing.

Language (ES ↔ EN) lives in the **settings menu (☰)** in the header — not a floating bubble.

### Screenshots

![Home](docs/screenshots/home-en.png)

![Never Have I Ever — party category](docs/screenshots/nhie-fiesta-en.png)

![The Impostor — setup](docs/screenshots/impostor-setup-en.png)

### What you get

- Two separate games from the home catalog
- Header settings menu: language, game shortcuts, help, about
- NHIE: JSON prompt banks, multi-category filters, per-category atmosphere
- Impostor: player names, fixed impostor table, chaos mode, discreet cards, hold-to-flip reveal
- Static hosting friendly (Netlify SPA redirects)

### Tech stack

- **Angular 22** — standalone components
- **TypeScript 5** — app language
- **CSS tokens** — Overprint + Sticker
- **Vitest** — unit tests (deck / deal logic)
- **Static JSON** — `frontend/public/data/`
- **Netlify** — static hosting + SPA redirects

### Run locally

```bash
cd frontend
npm install
npm start
```

UI: [http://localhost:4200](http://localhost:4200)

### Scripts

```bash
npm start      # Dev server → http://localhost:4200
npm run build  # Production build
npm test       # Unit tests
```

More detail: [frontend/README.md](frontend/README.md)

### Project structure

```text
Between-u-and-me/
├── docs/
│   └── screenshots/
├── frontend/
│   ├── public/
│   │   ├── _redirects
│   │   └── data/
│   │         ├── yo-nunca.json
│   │         ├── nhie.json
│   │         ├── impostor-es.json
│   │         └── impostor-en.json
│   └── src/app/
│         ├── core/i18n/
│         ├── pages/
│         │   ├── home/
│         │   ├── neverHaveIEver/
│         │   └── impostor/
│         └── shared/
│               ├── footer/
│               └── site-menu/
├── LICENSE
├── README.md
└── .gitignore
```

### Deploy on Netlify

| Setting | Value |
|---------|--------|
| Base directory | `frontend` |
| Build command | `npm run build` |
| Publish directory | `dist/between-u-and-me/browser` |

SPA fallback: `/*` → `/index.html` (`200`). Ships `frontend/public/_redirects`.

### License

MIT License. See [LICENSE](LICENSE).

---

<a id="espanol"></a>

## Español

**Aplicación web pública** | **Juegos para tu grupo de amigos** | **Sin login · Sin base de datos**

Between U & Me es un almacén pequeño de juegos. Ahora mismo:

- **Yo Nunca** / **Never Have I Ever** — frases al azar, filtros por categoría, sin repetir hasta agotar el mazo.
- **El Impostor** — pasar el móvil: los civiles ven la palabra; el impostor ve pista, categoría o nada.

El idioma (ES ↔ EN) se cambia en el **menú de ajustes (☰)** del header.

### Capturas

![Portada](docs/screenshots/home-es.png)

![Yo Nunca — categoría fiesta](docs/screenshots/nhie-fiesta-es.png)

![El Impostor — setup](docs/screenshots/impostor-setup-es.png)

### Qué incluye

- Catálogo en home con dos juegos separados
- Menú ☰: idioma, atajos, ayuda, acerca de
- Yo Nunca: bancos JSON, filtros, atmósfera por categoría
- Impostor: nombres, tabla de impostores, caos, modo discreto, carta hold-to-flip
- Listo para hosting estático (Netlify)

### Tecnologías

- **Angular 22** — componentes standalone
- **TypeScript 5**
- **Tokens CSS** — Overprint + Sticker
- **Vitest** — tests unitarios
- **JSON estático** — `frontend/public/data/`
- **Netlify** — hosting + redirects SPA

### Ejecutar en local

```bash
cd frontend
npm install
npm start
```

Interfaz: [http://localhost:4200](http://localhost:4200)

### Scripts

```bash
npm start      # Servidor de desarrollo → http://localhost:4200
npm run build  # Build de producción
npm test       # Tests unitarios
```

Más detalle: [frontend/README.md](frontend/README.md)

### Estructura del proyecto

```text
Between-u-and-me/
├── docs/
│   └── screenshots/
├── frontend/
│   ├── public/
│   │   ├── _redirects
│   │   └── data/
│   │         ├── yo-nunca.json
│   │         ├── nhie.json
│   │         ├── impostor-es.json
│   │         └── impostor-en.json
│   └── src/app/
│         ├── core/i18n/
│         ├── pages/
│         │   ├── home/
│         │   ├── neverHaveIEver/
│         │   └── impostor/
│         └── shared/
│               ├── footer/
│               └── site-menu/
├── LICENSE
├── README.md
└── .gitignore
```

### Desplegar en Netlify

| Ajuste | Valor |
|--------|--------|
| Base directory | `frontend` |
| Build command | `npm run build` |
| Publish directory | `dist/between-u-and-me/browser` |

Fallback SPA: `/*` → `/index.html` (`200`). Incluye `frontend/public/_redirects`.

### Licencia

Licencia MIT. Consulta [LICENSE](LICENSE).
