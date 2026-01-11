import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { appConfig } from '../config';
import type { Locale } from '../i18n';

export const pool = new Pool({ connectionString: appConfig.database.url });

type Project = {
	id: string;
	slug: string;
	status: 'published' | 'draft';
	tech: string | null;
	link: string | null;
};

type ProjectTranslation = {
	project_id: string;
	locale: Locale;
	name: string;
	description: string;
	hero_title: string | null;
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

type User = {
	id: string;
	email: string;
	name: string | null;
};

const initSchema = async (): Promise<void> => {
	const client = await pool.connect();
	try {
		await client.query(`
			CREATE TABLE IF NOT EXISTS users (
				id UUID PRIMARY KEY,
				email TEXT UNIQUE NOT NULL,
				name TEXT,
				created_at TIMESTAMPTZ DEFAULT NOW()
			);
			CREATE TABLE IF NOT EXISTS projects (
				id UUID PRIMARY KEY,
				slug TEXT UNIQUE NOT NULL,
				status TEXT DEFAULT 'draft',
				tech TEXT,
				link TEXT
			);
			CREATE TABLE IF NOT EXISTS project_translations (
				id SERIAL PRIMARY KEY,
				project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
				locale TEXT NOT NULL,
				name TEXT NOT NULL,
				description TEXT NOT NULL,
				hero_title TEXT,
				UNIQUE (project_id, locale)
			);
			CREATE TABLE IF NOT EXISTS pages (
				id UUID PRIMARY KEY,
				slug TEXT UNIQUE NOT NULL,
				template TEXT DEFAULT 'generic',
				published INTEGER DEFAULT 1
			);
			CREATE TABLE IF NOT EXISTS page_sections (
				id SERIAL PRIMARY KEY,
				page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
				locale TEXT NOT NULL,
				heading TEXT NOT NULL,
				body TEXT NOT NULL,
				position INTEGER DEFAULT 0,
				UNIQUE (page_id, locale, position)
			);
		`);
	} finally {
		client.release();
	}
};

export const getProjects = async (locale: Locale): Promise<ProjectWithTranslation[]> => {
	const projectsResult = await pool.query<Project>(
		`SELECT id, slug, status, tech, link FROM projects`
	);
	const translationsResult = await pool.query<ProjectTranslation>(
		`SELECT project_id, locale, name, description, hero_title FROM project_translations WHERE locale = $1`,
		[locale]
	);
	const translationMap = new Map(translationsResult.rows.map((translation) => [translation.project_id, translation]));
	return projectsResult.rows.map((project) => ({
		...project,
		translation: translationMap.get(project.id)
	}));
};

export const getProjectBySlug = async (slug: string, locale: Locale): Promise<ProjectWithTranslation | undefined> => {
	const projectResult = await pool.query<Project>(
		`SELECT id, slug, status, tech, link FROM projects WHERE slug = $1 LIMIT 1`,
		[slug]
	);
	const project = projectResult.rows[0];
	if (!project) {
		return undefined;
	}
	const translationResult = await pool.query<ProjectTranslation>(
		`SELECT project_id, locale, name, description, hero_title FROM project_translations WHERE project_id = $1 AND locale = $2 LIMIT 1`,
		[project.id, locale]
	);
	const translation = translationResult.rows[0];
	return translation ? { ...project, translation } : { ...project };
};

export const upsertProject = async (payload: Project, translations: ProjectTranslation[]): Promise<void> => {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		await client.query(
			`INSERT INTO projects (id, slug, status, tech, link)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO UPDATE SET status = EXCLUDED.status, tech = EXCLUDED.tech, link = EXCLUDED.link`,
			[payload.id, payload.slug, payload.status, payload.tech, payload.link]
		);

		for (const translation of translations) {
			await client.query(
				`INSERT INTO project_translations (project_id, locale, name, description, hero_title)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (project_id, locale) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, hero_title = EXCLUDED.hero_title`,
				[
					translation.project_id,
					translation.locale,
					translation.name,
					translation.description,
					translation.hero_title
				]
			);
		}
		await client.query('COMMIT');
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
};

export const getPages = async (locale: Locale): Promise<PageRecord[]> => {
	const pagesResult = await pool.query<{ id: string; slug: string; template: string; published: number | string }>(
		`SELECT id, slug, template, published FROM pages`
	);
	const pagesWithSections: PageRecord[] = [];
	for (const page of pagesResult.rows) {
		const sectionsResult = await pool.query<{ heading: string; body: string; position: number | string }>(
			`SELECT heading, body, position FROM page_sections WHERE page_id = $1 AND locale = $2 ORDER BY position`,
			[page.id, locale]
		);
		pagesWithSections.push({
			id: page.id,
			slug: page.slug,
			template: page.template,
			published: Number(page.published),
			sections: sectionsResult.rows.map((section) => ({
				heading: section.heading,
				body: section.body,
				position: Number(section.position)
			}))
		});
	}
	return pagesWithSections;
};

export const savePage = async (
	page: { id?: string; slug: string; template: string; published: number },
	sections: { locale: Locale; heading: string; body: string; position: number }[]
): Promise<void> => {
	const pageId = page.id ?? randomUUID();
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		await client.query(
			`INSERT INTO pages (id, slug, template, published)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE SET template = EXCLUDED.template, published = EXCLUDED.published`,
			[pageId, page.slug, page.template, page.published]
		);

		for (const section of sections) {
			await client.query(
				`INSERT INTO page_sections (page_id, locale, heading, body, position)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (page_id, locale, position) DO UPDATE SET heading = EXCLUDED.heading, body = EXCLUDED.body`,
				[pageId, section.locale, section.heading, section.body, section.position]
			);
		}
		await client.query('COMMIT');
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
};

export const getUserByEmail = async (email: string): Promise<User | undefined> => {
	const result = await pool.query<User>(`SELECT id, email, name FROM users WHERE email = $1 LIMIT 1`, [email]);
	return result.rows[0];
};

export const getOrCreateUser = async (params: { email: string; name?: string | null }): Promise<User> => {
	const existing = await getUserByEmail(params.email);
	if (existing) {
		return existing;
	}
	const user: User = { id: randomUUID(), email: params.email, name: params.name ?? null };
	await pool.query(`INSERT INTO users (id, email, name) VALUES ($1, $2, $3)`, [user.id, user.email, user.name]);
	return user;
};

const seedIfEmpty = async (): Promise<void> => {
	const projectCountResult = await pool.query<{ count: string }>('SELECT COUNT(*) as count FROM projects');
	if (Number(projectCountResult.rows[0]?.count ?? '0') > 0) {
		return;
	}

	const sampleProjectId = randomUUID();
	await upsertProject(
		{
			id: sampleProjectId,
			slug: 'aurora-brand',
			status: 'published',
			tech: 'Astro, Express, Tailwind',
			link: 'https://example.com'
		} as Project,
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
		] as ProjectTranslation[]
	);

	const aboutPageId = randomUUID();
	await savePage(
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

void initSchema()
	.then(seedIfEmpty)
	.catch((error: unknown) => {
		const message = error instanceof Error ? error.message : 'Unknown error';
		process.stderr.write(`DB init error: ${message}\n`);
	});

export type { Project, ProjectTranslation, User };
