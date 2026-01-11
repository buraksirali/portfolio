import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { appConfig } from '../config';
import type { Locale } from '../i18n';

const dbDir = path.dirname(appConfig.database.path);
if (!fs.existsSync(dbDir)) {
	fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(appConfig.database.path);

db.pragma('journal_mode = WAL');

db.exec(`
	CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		email TEXT UNIQUE,
		name TEXT,
		created_at TEXT DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS projects (
		id TEXT PRIMARY KEY,
		slug TEXT UNIQUE,
		status TEXT DEFAULT 'draft',
		tech TEXT,
		link TEXT
	);
	CREATE TABLE IF NOT EXISTS project_translations (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		project_id TEXT,
		locale TEXT,
		name TEXT,
		description TEXT,
		hero_title TEXT,
		FOREIGN KEY (project_id) REFERENCES projects(id)
	);
	CREATE TABLE IF NOT EXISTS pages (
		id TEXT PRIMARY KEY,
		slug TEXT UNIQUE,
		template TEXT DEFAULT 'generic',
		published INTEGER DEFAULT 1
	);
	CREATE TABLE IF NOT EXISTS page_sections (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		page_id TEXT,
		locale TEXT,
		heading TEXT,
		body TEXT,
		position INTEGER DEFAULT 0,
		FOREIGN KEY (page_id) REFERENCES pages(id)
	);
	CREATE TABLE IF NOT EXISTS settings (
		key TEXT PRIMARY KEY,
		value TEXT
	);
`);

type Project = {
	id: string;
	slug: string;
	status: 'published' | 'draft';
	tech?: string;
	link?: string;
};

type ProjectTranslation = {
	project_id: string;
	locale: Locale;
	name: string;
	description: string;
	hero_title?: string;
};

type ProjectWithTranslation = Project & { translation?: ProjectTranslation };

type PageSection = {
	heading: string;
	body: string;
	position: number;
};

type PageRecord = {
	id: string;
	slug: string;
	template: string;
	published: number;
	sections: PageSection[];
};

const getProjectTranslations = db.prepare(
	`SELECT project_id, locale, name, description, hero_title FROM project_translations WHERE locale = ?`
);

const getProjectsStmt = db.prepare(`SELECT id, slug, status, tech, link FROM projects`);

const getProjectBySlugStmt = db.prepare(
	`SELECT id, slug, status, tech, link FROM projects WHERE slug = ? LIMIT 1`
);

export const getProjects = (locale: Locale): ProjectWithTranslation[] => {
	const projects: Project[] = getProjectsStmt.all() as Project[];
	const translations = getProjectTranslations.all(locale) as ProjectTranslation[];
	const translationMap = new Map(translations.map((translation) => [translation.project_id, translation]));
	return projects.map((project) => ({
		...project,
		translation: translationMap.get(project.id)
	}));
};

export const getProjectBySlug = (slug: string, locale: Locale): ProjectWithTranslation | undefined => {
	const project = getProjectBySlugStmt.get(slug) as Project | undefined;
	if (!project) {
		return undefined;
	}
	const translation = db
		.prepare(
			`SELECT project_id, locale, name, description, hero_title FROM project_translations WHERE project_id = ? AND locale = ?`
		)
		.get(project.id, locale) as ProjectTranslation | undefined;
	return translation ? { ...project, translation } : { ...project };
};

export const upsertProject = (payload: Project, translations: ProjectTranslation[]): void => {
	db.prepare(
		`INSERT INTO projects (id, slug, status, tech, link) VALUES (@id, @slug, @status, @tech, @link)
		 ON CONFLICT(slug) DO UPDATE SET status = @status, tech = @tech, link = @link`
	).run(payload);

	const translationStmt = db.prepare(
		`INSERT OR REPLACE INTO project_translations (project_id, locale, name, description, hero_title)
		VALUES (@project_id, @locale, @name, @description, @hero_title)`
	);
	for (const translation of translations) {
		translationStmt.run(translation);
	}
};

const getPagesStmt = db.prepare(`SELECT id, slug, template, published FROM pages`);

export const getPages = (locale: Locale): PageRecord[] => {
	const pages = getPagesStmt.all() as { id: string; slug: string; template: string; published: number }[];
	return pages.map((page): PageRecord => {
		const sections = db
			.prepare(
				`SELECT heading, body, position FROM page_sections WHERE page_id = ? AND locale = ? ORDER BY position`
			)
			.all(page.id, locale) as PageSection[];
		return { ...page, sections };
	});
};

export const savePage = (
	page: { id?: string; slug: string; template: string; published: number },
	sections: { locale: Locale; heading: string; body: string; position: number }[]
): void => {
	const pageId = page.id ?? randomUUID();
	db.prepare(
		`INSERT INTO pages (id, slug, template, published) VALUES (@id, @slug, @template, @published)
		 ON CONFLICT(slug) DO UPDATE SET template=@template, published=@published`
	).run({ ...page, id: pageId });

	const stmt = db.prepare(
		`INSERT OR REPLACE INTO page_sections (page_id, locale, heading, body, position)
		VALUES (@page_id, @locale, @heading, @body, @position)`
	);
	for (const section of sections) {
		stmt.run({ ...section, page_id: pageId });
	}
};

type User = {
	id: string;
	email: string;
	name?: string;
};

export const getUserByEmail = (email: string): User | undefined => {
	const existing = db.prepare(`SELECT id, email, name FROM users WHERE email = ?`).get(email) as User | undefined;
	return existing;
};

const seedIfEmpty = (): void => {
	const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
	if (projectCount.count > 0) {
		return;
	}

	const sampleProjectId = randomUUID();
	upsertProject(
		{
			id: sampleProjectId,
			slug: 'aurora-brand',
			status: 'published',
			tech: 'Astro, Express, Tailwind',
			link: 'https://example.com'
		},
		[
			{
				project_id: sampleProjectId,
				locale: 'en',
				name: 'Aurora Brand',
				description: 'Brand site with fast SSR and portable content.',
				hero_title: 'A warm, high-speed brand presence'
			},
			{
				project_id: sampleProjectId,
				locale: 'tr',
				name: 'Aurora Marka',
				description: 'Hızlı SSR ve taşınabilir içerik ile marka sitesi.',
				hero_title: 'Sıcak ve hızlı bir marka deneyimi'
			},
			{
				project_id: sampleProjectId,
				locale: 'de',
				name: 'Aurora Marke',
				description: 'Markenauftritt mit schnellem SSR und portablen Inhalten.',
				hero_title: 'Ein warmer, schneller Markenauftritt'
			}
		]
	);

	const aboutPageId = randomUUID();
	savePage(
		{ id: aboutPageId, slug: 'about', template: 'generic', published: 1 },
		[
			{
				locale: 'en',
				heading: 'Our promise',
				body: 'We keep content portable so you stay in control.',
				position: 0
			},
			{
				locale: 'tr',
				heading: 'Sözümüz',
				body: 'İçeriği taşınabilir tutarak kontrol sizde kalır.',
				position: 0
			},
			{
				locale: 'de',
				heading: 'Unser Versprechen',
				body: 'Wir halten Inhalte portabel, damit du die Kontrolle behältst.',
				position: 0
			}
		]
	);
};

seedIfEmpty();

export type { Project, ProjectTranslation, User };
