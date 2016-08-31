import { configure } from '@kadira/storybook';

function loadStories() {
  require('../src/tests/stories');
}

configure(loadStories, module);
