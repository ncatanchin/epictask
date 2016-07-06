const jade = require('jade')

module.exports = function(content) {
	const template = jade.compile(content)
	this.cacheable()
	return template({require,process})
};