require("dotenv").config();
const app = require("./app");
const conectarBanco = require("./config/db");

const PORT = process.env.PORT || 3000;

(async()=>{
  try {
    await conectarBanco();
    app.listen(PORT,()=>console.log(`Servidor em http://localhost:${PORT}`));
  } catch (erro) {
    console.error(erro);
    process.exit(1);
  }
})();