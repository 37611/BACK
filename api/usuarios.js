import { connectToDatabase } from "./index.js";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "GET") {
    return res.status(405).json({
      sucesso: false,
      mensagem: "Método não permitido."
    });
  }

  try {
    const db = await connectToDatabase();
    const usuarios = await db.collection("usuarios").find({}).toArray();

    return res.status(200).json({
      sucesso: true,
      total: usuarios.length,
      usuarios
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao conectar ao MongoDB."
    });
  }
}
