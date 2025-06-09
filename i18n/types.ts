export interface TranslationKeys {
  slogan: string;
}

// This will help with TypeScript autocompletion for translation keys
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: TranslationKeys;
    };
  }
}