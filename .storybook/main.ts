import type { StorybookConfig } from '@storybook/html-vite';

const config: StorybookConfig = {
	stories: ['../stories/**/*.stories.@(js|ts)'],
	addons: ['@storybook/addon-essentials', '@storybook/addon-links', '@storybook/addon-interactions'],
	framework: {
		name: '@storybook/html-vite',
		options: {}
	},
	docs: {
		autodocs: 'tag'
	},
	core: {
		disableTelemetry: true
	}
};

export default config;
