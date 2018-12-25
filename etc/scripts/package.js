#!/usr/bin/env node
require("shelljs/global")
require("./init-scripts")

const
  Glob = require("glob"),
  Path = require('path'),
  env = process.env.MAPPER_ENV,
  buildEnv = ['prod','dev'].includes(env) ? env : 'local',
  osName = exec(`uname`).stdout,
  basePath = Path.resolve(__dirname,"..",".."),
  pkg = readJsonFile(Path.resolve(basePath,"package.json")),
  version = pkg.version

echo(`Building version ${version} on ${osName}`)
process.env.MAPPER_BUILD = "true"
run(`node ${Path.resolve(__dirname, 'compile.js')}`)
run(`./node_modules/.bin/electron-builder`)


const
  ext = osName.includes('Linux') ? "AppImage" : "dmg",
  files = Glob.sync(`dist/**/*.${ext}`, {cwd: basePath}),
  file = files[0]

mv(file, Path.resolve(basePath,"dist",`mapper-saffron-${buildEnv}-${version}.${ext}`))



