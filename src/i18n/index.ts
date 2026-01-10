import en from './locales/en.json';
import tr from './locales/tr.json';
import de from './locales/de.json';

const dictionaries = { en, tr, de } as const;

export type Locale = keyof typeof dictionaries;

type TranslationTree = string | TranslationBranch;

interface TranslationBranch {
	[key: string]: TranslationTree;
}

type NestedKeys<T> = T extends object
	? {
			[K in Extract<keyof T, string>]: T[K] extends object ? `${K}.${NestedKeys<T[K]>}` : K;
	  }[Extract<keyof T, string>]
	: never;

export type TranslationKey = NestedKeys<typeof en>;

export const defaultLocale: Locale = 'en';
export const supportedLocales: Locale[] = Object.keys(dictionaries) as Locale[];

const isLocale = (value: string | undefined): value is Locale =>
	typeof value === 'string' && supportedLocales.some((localeCode) => localeCode === value);

const getFromPath = (tree: TranslationTree, path: string): string | undefined => {
	let current: TranslationTree | undefined = tree;
	for (const segment of path.split('.')) {
		if (typeof current !== 'object' || current === null) {
			return undefined;
		}
		current = (current as Record<string, TranslationTree>)[segment];
		if (current === undefined) {
			return undefined;
		}
	}
	return typeof current === 'string' ? current : undefined;
};

export const translate = (locale: Locale, key: TranslationKey): string => {
	const dictionary = dictionaries[locale] ?? dictionaries[defaultLocale];
	const value = getFromPath(dictionary, key);
	if (value) {
		return value;
	}
	const fallback = getFromPath(dictionaries[defaultLocale], key);
	return fallback ?? key;
};

export const createTranslator = (locale: string | undefined): ((key: TranslationKey) => string) => {
	const safeLocale: Locale = isLocale(locale) ? locale : defaultLocale;
	return (key: TranslationKey) => translate(safeLocale, key);
};
