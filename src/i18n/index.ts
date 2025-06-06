import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translations
import enTranslation from './locales/en.json'
import viTranslation from './locales/vi.json'

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: enTranslation
            },
            vi: {
                translation: viTranslation
            }
        },
        fallbackLng: 'en',
        debug: true,
        interpolation: {
            escapeValue: false
        }
    })

export default i18n 