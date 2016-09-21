// Setup story environment
import {getDecorator} from "./StoryHelper"

import * as faker from 'faker'
import { VisibleList } from "ui/components/common/VisibleList"
const {storiesOf, action, linkTo} = require('@kadira/storybook')

// logger
const
	log = getLogger(__filename),
	itemRenderer = (items,index) => {
		const
			item = items[index] || {}
		
		return !item ? React.DOM.noscript() : <div style={{height:100}}>
			<span>{index}</span>
			<span>{item.name}</span>
		</div>
	}

storiesOf('Visible List',module)
	.addDecorator(getDecorator)
	
	// JobMonitor - no logs
	.add('Without logs', () => {
		const
			items = Array
				.apply(null, {length: 500})
				.map((nil,index) => ({
					index,
					name: faker.lorem.sentence(10)
				}))
			
		
		return <VisibleList style={{root:Fill}}
		                    items={items}
		                    itemCount={items.length}
		                    itemHeight={100}
		                    itemRenderer={itemRenderer}
		                    initialItemsPerPage={30}
		                    />
	})