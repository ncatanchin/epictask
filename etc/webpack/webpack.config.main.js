
//throw Error('wtf')
module.exports = process.env.NODE_ENV !== "production" ?
  require("./webpack.config")(true) :
  (env,config) => require("./webpack.config")(true,config,env)
//require("./webpack.config")(true,env)
