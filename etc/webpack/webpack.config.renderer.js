module.exports = process.env.NODE_ENV !== "production" ?
  require("./webpack.config")(false) :
  (env,config)  => require("./webpack.config")(false,config,env)
