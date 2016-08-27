
const categoryLevels = require('shared/LogCategories')

Object.assign(global as any, {
	TypeLoggerCategories: categoryLevels,
	TypeLoggerDefaultLevel: 3
})