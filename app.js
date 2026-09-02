const express = require("express");
const cors = require("cors");
const conectarBanco = require("./config/db");
const userRouter = require("./routes/UserRouters");

const app = express();

app.use(cors({
  origin:true,
  methods:["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders:["Content-Type","Authorization"]
}));
app.use(express.json());

app.get("/", (req,res)=>res.status(200).json({ sucesso:true, mensagem:"API Mural da Turma funcionando! 🚀", versao:"2.0.0" }));
app.get("/api", (req,res)=>res.status(200).json({ sucesso:true, mensagem:"API funcionando! 🚀", versao:"2.0.0" }));

app.use("/api/usuarios", async (req,res,next)=>{
  try { await conectarBanco(); next(); }
  catch (erro) {
    console.error("MongoDB:",erro);
    res.status(500).json({ sucesso:false, mensagem:"Erro ao conectar ao MongoDB." });
  }
});

app.use("/api/usuarios", userRouter);

module.exports = app;