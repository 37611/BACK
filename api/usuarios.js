import { connectToDatabase } from "./index.js";
import { requireAuth, setCors } from "./_lib/auth.js";

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

    const usuarios = await db.collection("usuarios")
      .find({ ativo: { $ne: false } })
      .project({ senha: 0 })
      .sort({ criadoEm: -1 })
      .toArray();

    const resultado = usuarios.map((usuario) => ({
      id: usuario._id.toString(),
      nome: usuario.nome,
      email: usuario.email,
      ativo: usuario.ativo !== false,
      criadoEm: usuario.criadoEm
    }));

    return res.status(200).json({
      sucesso: true,
      total: resultado.length,
      usuarios: resultado
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar usuários."
    });
  }
}
