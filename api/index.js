import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedDb) return cachedDb;

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI não configurada.");
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }

  const dbName = process.env.MONGODB_DB || "mural_turma";
  cachedDb = cachedClient.db(dbName);

  return cachedDb;
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  setCors(res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      sucesso: false,
      mensagem: "Método não permitido."
    });
  }

  return res.status(200).json({
    sucesso: true,
    mensagem: "API funcionando! 🚀",
    versao: "2.0.0"
  });
}
