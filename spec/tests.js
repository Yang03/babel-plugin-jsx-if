var plugin = require("../src/index")

require("@babel/register")({
  presets: ["@babel/preset-react"],
  plugins: [plugin],
  cache: false
})

require("./test/if")
