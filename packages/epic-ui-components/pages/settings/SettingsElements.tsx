


import { Icon } from "epic-ui-components/common"

export function SettingsSection({styles,iconSet = 'fa',iconName,title,children= null}) {
	
	return <div>
		<div style={styles.form.title}>
			<Icon style={styles.form.title.icon}
			      iconSet={iconSet as any}
			      iconName={iconName}/>
			<span>{title}</span>
		</div>
		{children}
	</div>
}

export function SettingsField({styles,label,children = null}) {
	return <div style={styles.form.row}>
		<div style={styles.form.labelCell}>
			{label}
		</div>
		
		{children}
	
	</div>
}