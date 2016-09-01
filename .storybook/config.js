import { configure } from '@kadira/storybook'
import {ProcessType} from "shared/ProcessType"
import 'shared/ProcessConfig'

ProcessConfig.setType(ProcessType.Storybook)



const req = require.context('../src/tests/stories',true)
function loadStories() {
	//require('../src/tests/stories/StatusBarStories')
	console.log(`All story keys`,req.keys())
  req.keys().forEach(req)
}

configure(loadStories, module);




