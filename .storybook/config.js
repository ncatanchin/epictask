require('babel-polyfill')
import { configure } from '@kadira/storybook'
import {ProcessType} from "epic-global"
import 'epic-global'





const req = require.context('../dist/out/tests/stories',true)

function loadStories() {
	ProcessConfig.setType(ProcessType.Storybook)
	//require('../src/tests/stories/StatusBarStories')
	console.log(`All story keys`,req.keys())
  req.keys().forEach(req)
}

configure(loadStories, module);




