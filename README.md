# Between U & Me

[![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Vitest](https://img.shields.io/badge/Tests-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7?logo=netlify&logoColor=white)](https://www.netlify.com/)

Friends’ game vault — play party games together. First game: **Never Have I Ever** / **Yo Nunca**.

---

## English

### What it is

A small web app to store and play games with your friend group. The first game is **Never Have I Ever**, with:

- Random prompts from a JSON bank
- One or more category filters (or all categories)
- No repeats until every prompt in the current filter has been shown, then the deck reshuffles
- Spanish / English UI and prompt packs

### Tech stack

| Area | Choice |
|------|--------|
| Framework | Angular 22 (standalone components) |
| Language | TypeScript |
| Styling | CSS with shared design tokens |
| Tests | Vitest |
| Data | Static JSON prompt banks |
| Hosting | Static build (Netlify-ready) |

### Requirements

- **Node.js** 20 or newer
- **npm** 10 or newer

### Project structure

```text
Between-u-and-me/
├── frontend/                      # Angular app
│   ├── public/data/
│   │   ├── yo-nunca.json          # Spanish prompts (served)
│   │   └── nhie.json              # English prompts (served)
│   └── src/app/
│       ├── core/i18n/             # Locale + UI strings
│       ├── pages/
│       │   ├── home/              # Landing page
│       │   └── neverHaveIEver/    # Game screen + deck logic
│       └── shared/
│           └── language-bubble/   # ES/EN switcher
├── backend/                       # Reserved for a future API
├── yo_nunca.json                  # Source Spanish prompts
├── nhie.json                      # Source English prompts
├── LICENSE
└── README.md
```

### How to run locally

```bash
cd frontend
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200).

### How to play

1. Open the home page — **Between U & Me**
2. Click **Never Have I Ever** / **Yo Nunca**
3. Select one or more categories, or **All**
4. Read the prompt and press **Next prompt** / **Otra frase**
5. Use the language bubble (bottom-right) to switch **ES ↔ EN**

When English is selected, prompts load from `nhie.json`. When Spanish is selected, they load from `yo-nunca.json`.

### Scripts

```bash
npm start      # Dev server (http://localhost:4200)
npm run build  # Production build
npm test       # Unit tests
```

### Deploy on Netlify

| Setting | Value |
|---------|--------|
| Base directory | `frontend` |
| Build command | `npm run build` |
| Publish directory | `dist/between-u-and-me/browser` |

For Angular client routes such as `/nhie`, configure an SPA fallback so refreshes do not 404 (`/*` → `/index.html` with status `200`).

---

## Español

### Qué es

Una web pequeña para guardar y jugar juegos con tu grupo de amigos. El primero es **Yo Nunca**, con:

- Frases aleatorias desde un banco JSON
- Filtro por una o varias categorías (o todas)
- Sin repeticiones hasta agotar las frases del filtro; después se baraja de nuevo
- Interfaz y frases en español e inglés

### Tecnologías

| Área | Elección |
|------|----------|
| Framework | Angular 22 (componentes standalone) |
| Lenguaje | TypeScript |
| Estilos | CSS con tokens de diseño compartidos |
| Tests | Vitest |
| Datos | Bancos JSON estáticos |
| Hosting | Build estático (listo para Netlify) |

### Requisitos

- **Node.js** 20 o superior
- **npm** 10 o superior

### Estructura del proyecto

```text
Between-u-and-me/
├── frontend/                      # App Angular
│   ├── public/data/
│   │   ├── yo-nunca.json          # Frases en español (servidas)
│   │   └── nhie.json              # Frases en inglés (servidas)
│   └── src/app/
│       ├── core/i18n/             # Idioma + textos de UI
│       ├── pages/
│       │   ├── home/              # Portada
│       │   └── neverHaveIEver/    # Pantalla de juego + lógica del mazo
│       └── shared/
│           └── language-bubble/   # Selector ES/EN
├── backend/                       # Reservado para una API futura
├── yo_nunca.json                  # Fuente de frases en español
├── nhie.json                      # Fuente de frases en inglés
├── LICENSE
└── README.md
```

### Cómo ejecutarlo en local

```bash
cd frontend
npm install
npm start
```

Abrí [http://localhost:4200](http://localhost:4200).

### Cómo se juega

1. Entrá a la home — **Between U & Me**
2. Pulsá **Yo Nunca**
3. Elegí una o varias categorías, o **Todas**
4. Leé la frase y pulsá **Otra frase**
5. Usá la burbuja de idioma (abajo a la derecha) para cambiar **ES ↔ EN**

Con inglés seleccionado se cargan las frases de `nhie.json`. Con español, las de `yo-nunca.json`.

### Scripts

```bash
npm start      # Servidor de desarrollo
npm run build  # Build de producción
npm test       # Tests unitarios
```

### Deploy en Netlify

| Ajuste | Valor |
|--------|--------|
| Base directory | `frontend` |
| Build command | `npm run build` |
| Publish directory | `dist/between-u-and-me/browser` |

Para rutas de Angular como `/nhie`, configurá un fallback SPA para que al refrescar no dé 404 (`/*` → `/index.html` con estado `200`).

---

## License

MIT — see [LICENSE](./LICENSE).
