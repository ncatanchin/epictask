const jade = require('jade')

module.exports = function(content) {
	const template = jade.compile(content)
	return template({require,process})
};