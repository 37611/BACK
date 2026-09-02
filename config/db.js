const mongoose = require("mongoose");

let conexao = null;

async function conectarBanco() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI não configurada.");

  if (!conexao) {
    conexao = mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB || "mural_turma",
      serverSelectionTimeoutMS: 10000
    }).catch((erro) => {
      conexao = null;
      throw erro;
    });
  }

  await conexao;
  return mongoose.connection;
}

module.exports = conectarBanco;