import { configure } from '@storybook/react';

function loadStories() {
  require('../src/stories');
  require('../src/auth/stories');
}

configure(loadStories, module);
