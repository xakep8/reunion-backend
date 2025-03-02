const app = require("./app");
require("dotenv").config();

app.listen(process.env.PORT || 3000, () => {
  console.log("Started express server at port 3000");
});
