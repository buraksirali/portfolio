import type { Preview } from '@storybook/html';
import '../src/styles/global.css';

const preview: Preview = {
	parameters: {
		controls: { expanded: true },
		backgrounds: {
			default: 'light',
			values: [
				{ name: 'light', value: 'var(--color-background)' },
				{ name: 'dark', value: '#1a0f07' }
			]
		}
	}
};

export default preview;
