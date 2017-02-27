import "../scripts/init-scripts"
import {makeConfig,makeHotEntry} from "./make-webpack-config"
import HtmlWebpackPlugin from 'html-webpack-plugin'


module.exports = makeConfig('epic-app', [], {
		"epic-entry-database-server": makeHotEntry([
			"./epic-entry-database-server/index"
		]),
		"epic-entry-job-server": makeHotEntry([
			"./epic-entry-job-server/index"
		]),
		"epic-entry-main": makeHotEntry([
			"./epic-entry-main/MainEntry"
		]),
		"epic-entry-ui": makeHotEntry([
			"./epic-entry-ui/index"
		]),
		
	}, config => {
		config.plugins.unshift(
			new HtmlWebpackPlugin({
				filename: "browser-entry.html",
				template: `${process.cwd()}/packages/epic-assets/templates/BrowserEntry.jade`,
				inject: false,
				isDev
			}),
			
			new HtmlWebpackPlugin({
				filename: "splash-entry.html",
				template: `${process.cwd()}/packages/epic-assets/templates/SplashEntry.jade`,
				inject: false,
				isDev
			})
		)
	})

	 




