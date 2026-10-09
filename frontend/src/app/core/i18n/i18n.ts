import { Injectable, computed, signal } from '@angular/core';

export type Locale = 'es' | 'en';

const messages = {
  es: {
    homeLead: 'El almacén de juegos de tu grupo de amigos.',
    homeCta: 'Yo Nunca',
    nhieEyebrow: 'juego',
    nhieTitle: 'Yo Nunca',
    nhieBack: 'Between U & Me',
    nhieCategoriesLabel: 'Categorías',
    nhieAllCategories: 'Todas',
    nhieNext: 'Otra frase',
    nhieEmpty:
      'No hay frases para las categorías seleccionadas. Probá con otras.',
    nhieLoading: 'Cargando frases…',
    nhieError: 'No se pudieron cargar las frases. Recargá la página.',
    nhieProgress: 'Frase {current} de {total}',
    nhieReshuffled: 'Volviste a empezar el mazo',
    nhieCategory: {
      sexo_y_sexualidad: 'Sexo y sexualidad',
      amor_y_relaciones: 'Amor y relaciones',
      fiesta_alcohol_y_drogas: 'Fiesta, alcohol y drogas',
      amistades_y_vida_social: 'Amistades y vida social',
      vergüenza_y_situaciones_comprometidas: 'Vergüenza y situaciones comprometidas',
      estudios_trabajo_y_vida_cotidiana: 'Estudios, trabajo y vida cotidiana',
      redes_sociales_y_tecnologia: 'Redes sociales y tecnología',
      delitos_y_problemas_legales: 'Delitos y problemas legales',
      personalidad_pensamientos_y_emociones: 'Personalidad, pensamientos y emociones',
      otros: 'Otros',
    } as Record<string, string>,
    footerCredit: 'Hecho por MGR',
    langLabel: 'Idioma',
    langEs: 'Español',
    langEn: 'English',
  },
  en: {
    homeLead: "Your friend group's game vault.",
    homeCta: 'Never Have I Ever',
    nhieEyebrow: 'game',
    nhieTitle: 'Never Have I Ever',
    nhieBack: 'Between U & Me',
    nhieCategoriesLabel: 'Categories',
    nhieAllCategories: 'All',
    nhieNext: 'Next prompt',
    nhieEmpty: 'No prompts for the selected categories. Try different ones.',
    nhieLoading: 'Loading prompts…',
    nhieError: 'Could not load prompts. Please reload the page.',
    nhieProgress: 'Prompt {current} of {total}',
    nhieReshuffled: 'Deck reshuffled',
    nhieCategory: {
      sexo_y_sexualidad: 'Sex & sexuality',
      amor_y_relaciones: 'Love & relationships',
      fiesta_alcohol_y_drogas: 'Parties, alcohol & drugs',
      amistades_y_vida_social: 'Friends & social life',
      vergüenza_y_situaciones_comprometidas: 'Embarrassment & awkward situations',
      estudios_trabajo_y_vida_cotidiana: 'School, work & daily life',
      redes_sociales_y_tecnologia: 'Social media & tech',
      delitos_y_problemas_legales: 'Crime & legal trouble',
      personalidad_pensamientos_y_emociones: 'Personality, thoughts & emotions',
      otros: 'Other',
    } as Record<string, string>,
    footerCredit: 'Made by MGR',
    langLabel: 'Language',
    langEs: 'Español',
    langEn: 'English',
  },
} as const;

export type MessageKey = keyof (typeof messages)['es'];

const STORAGE_KEY = 'bum-locale';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly localeSignal = signal<Locale>(this.readInitialLocale());

  readonly locale = this.localeSignal.asReadonly();
  readonly t = computed(() => messages[this.localeSignal()]);

  setLocale(locale: Locale): void {
    this.localeSignal.set(locale);
    document.documentElement.lang = locale;
    localStorage.setItem(STORAGE_KEY, locale);
  }

  categoryLabel(id: string): string {
    return this.t().nhieCategory[id] ?? id.replaceAll('_', ' ');
  }

  private readInitialLocale(): Locale {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'es' || saved === 'en') {
      document.documentElement.lang = saved;
      return saved;
    }

    const browserLang = navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';
    document.documentElement.lang = browserLang;
    return browserLang;
  }
}
