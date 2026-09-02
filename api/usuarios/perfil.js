import { connectToDatabase } from "../index.js";
import { requireAuth, setCors } from "../_lib/auth.js";

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

  const usuarioToken = requireAuth(req, res);
  if (!usuarioToken) return;

  try {
    const db = await connectToDatabase();
    const { ObjectId } = await import("mongodb");

    const usuario = await db.collection("usuarios").findOne(
      { _id: new ObjectId(usuarioToken.id), ativo: { $ne: false } },
      { projection: { senha: 0 } }
    );

    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Usuário não encontrado."
      });
    }

    return res.status(200).json({
      sucesso: true,
      usuario: {
        id: usuario._id.toString(),
        nome: usuario.nome,
        email: usuario.email,
        ativo: usuario.ativo !== false,
        criadoEm: usuario.criadoEm
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar perfil."
    });
  }
}
