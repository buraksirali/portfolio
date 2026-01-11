import node from '@astrojs/node';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';
import { appConfig } from './src/config';

export default defineConfig({
	site: appConfig.seo.canonicalHost,
	output: 'server',
	adapter: node({
		mode: 'middleware'
	}),
	integrations: [
		tailwind({
			applyBaseStyles: false
		})
	]
});
