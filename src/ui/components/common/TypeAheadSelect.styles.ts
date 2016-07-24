
const baseStyles = createStyles({
	root: [{
		flex: '1 0 20rem',
		width: 'auto',
		boxSizing: 'border-box'
	}],

	hint: [makeTransition('opacity'), {
		zIndex: 3,
		bottom: 5,
		opacity: 0,
		transform: 'translate(1.3rem,0rem)',

		visible: {
			opacity: 1
		}

	}],

	list: [{
		paddingTop: 0,
		paddingBottom: 0,
		backgroundColor: 'transparent !important'
	}]
})

export default baseStyles