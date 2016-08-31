import React from 'react'
import { storiesOf, action, linkTo } from '@kadira/storybook'
import {Provider, connect} from 'react-redux'
import {StatusBar} from 'ui/components/root/StatusBar'
const store = require('shared/store/AppStore').loadAndInitStorybookStore()

storiesOf('StatusBar', module)
	.addDecorator(getStory => <Provider store={store}>{getStory()}</Provider>)
	.add('With a job', () => (
    
    <StatusBar />
  ))

// storiesOf('Button', module)
//   .add('with text', () => (
//     <Button onClick={action('clicked')}>Hello Button</Button>
//   ))
//   .add('with some emoji', () => (
//     <Button onClick={action('clicked')}>😀 😎 👍 💯</Button>
//   ))
