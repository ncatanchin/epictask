#!/usr/bin/env node

require("shelljs/global")
require("./init-scripts")

const
  env = process.env.MAPPER_ENV,
  buildEnv = ['prod','dev'].includes(env) ? env : 'local'

let vars = "MAPPER_BUILD=true"
if (buildEnv !== 'local') {
  vars += ` MAPPER_ENV=${buildEnv}`
}

run(`./node_modules/.bin/cross-env ${vars} ./node_modules/.bin/electron-webpack --env.minify=false`)
