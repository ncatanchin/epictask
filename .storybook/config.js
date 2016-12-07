require('babel-polyfill')
// import { configure } from '@kadira/storybook'
import "epic-entry-shared/ProcessConfig"

ProcessConfig.setType(ProcessType.Storybook)


const
	{configure} = require('@kadira/storybook')

//const req = require.context('../dist/out/tests/stories',true)
const req = require.context('epic-tests/stories',true)

function loadStories() {
	ProcessConfig.setType(ProcessType.Storybook)
	//require('../src/tests/stories/StatusBarStories')
	console.log(`All story keys`,req.keys())
  req.keys().forEach(req)
}

configure(loadStories, module);




