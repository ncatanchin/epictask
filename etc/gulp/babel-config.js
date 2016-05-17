const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const {readJSONFileSync} = require('../tools/helpers')

const babelDefaultConfig = readJSONFileSync(`${processDir}/.babelrc`)

module.exports = {
	makeBabelConfig() {

		/**
		 * Load the babel config
		 *
		 * @type {null}
		 */
		return babelDefaultConfig
		

	}
}