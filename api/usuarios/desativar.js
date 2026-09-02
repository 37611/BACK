import { connectToDatabase } from "../index.js";
import { requireAuth, setCors } from "../_lib/auth.js";

export default async function handler(req, res) {
  setCors(res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "DELETE") {
    return res.status(405).json({
      sucesso: false,
      mensagem: "Método não permitido."
    });
  }

  const usuarioToken = requireAuth(req, res);
  if (!usuarioToken) return;

  try {
    const db = await connectToDatabase();
    const { ObjectId } = await import("mongodb");

    const resultado = await db.collection("usuarios").updateOne(
      { _id: new ObjectId(usuarioToken.id), ativo: { $ne: false } },
      {
        $set: {
          ativo: false,
          desativadoEm: new Date()
        }
      }
    );

    if (!resultado.matchedCount) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Usuário não encontrado."
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: "Conta desativada com sucesso."
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao desativar conta."
    });
  }
}
