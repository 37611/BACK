import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI não configurada.");
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(process.env.MONGODB_URI);
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db(process.env.MONGODB_DB || undefined);
  return cachedDb;
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "GET") {
    return res.status(405).json({
      sucesso: false,
      mensagem: "Método não permitido."
    });
  }

  // Rota básica: não exige MongoDB para confirmar que a API está online.
  return res.status(200).json({
    sucesso: true,
    mensagem: "API funcionando! 🚀",
    versao: "1.0.0"
  });
}

// Mantém a função de conexão disponível para futuras rotas.
// Para usar MongoDB, crie uma rota separada dentro de /api.
export { connectToDatabase };
