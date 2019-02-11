const
  {getValue} = require("typeguard"),
  nodeEnv = process.env.NODE_ENV || "development",
  envName = getValue(() => process.env.MAPPER_ENV,
    getValue(() => process.env.USER, "prod")
  ).substring(0, 10),
  isDev = nodeEnv !== 'production',
  devToolsOpen = false,//isDev,
  envStartupBuild = getValue(() => process.env.MAPPER_BUILD, "default"),
  Path = require('path'),
  Fs = require('fs'),
  baseDir = Path.resolve(__dirname, "..", ".."),
  _ = require('lodash'),
  pkgJson = JSON.parse(Fs.readFileSync(Path.resolve(baseDir, 'package.json'), 'utf-8')),
  isProd = envName === 'prod'

module.exports = isProcessMain => ({
  isDev,
  __DEV__: isDev,
  DEBUG: isDev,
  'process.env.isMainProcess': isProcessMain,
  VERSION: JSON.stringify(pkgJson.version),
  MAPPER_ENV: JSON.stringify(envName),

  'process.env.devToolsOpen': devToolsOpen,
  'process.env.MAPPER_ENV': JSON.stringify(envName),
  'process.env.__DEV__': isDev,
  'process.env.PACKAGE': JSON.stringify(process.env.PACKAGE ? "true" : "false"),
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  'process.env.BASEDIR': JSON.stringify(baseDir),
  'process.env.MAPPER_CONFIG': JSON.stringify({}),
  'process.env.MAPPER_BUILD': JSON.stringify(envStartupBuild),  // controls the startup URL in main/index.ts
  'process.env.PUSHER_APP_ID': JSON.stringify(isProd ? '587311' : '587309'),
  'process.env.PUSHER_KEY': JSON.stringify(isProd ? '4e9865dd5382debb146f' : 'feb85881f22a0444fc7d'),
  'process.env.PUSHER_CLUSTER': JSON.stringify('mt1'),
  MAPPER_BUILD: JSON.stringify(envStartupBuild)
})
