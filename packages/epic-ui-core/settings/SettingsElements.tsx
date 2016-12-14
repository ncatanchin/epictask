


import { Icon } from "epic-ui-components/common"
import { isString } from "typeguard"

export function SettingsSection({styles,iconSet = 'fa',style = null,iconName,title,children= null}) {
	
	return <div>
		<div style={mergeStyles(styles.form.title,style)}>
			<Icon style={styles.form.title.icon}
			      iconSet={iconSet as any}
			      iconName={iconName}/>
			{isString(title) ? <div>{title}</div> : title}
		</div>
		{children}
	</div>
}

export function SettingsField({styles,label,children = null, style = null}) {
	return <div style={mergeStyles(styles.form.row,style)}>
		<div style={styles.form.labelCell}>
			{label}
		</div>
		
		{children}
	
	</div>
}