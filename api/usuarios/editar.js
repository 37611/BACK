import { connectToDatabase } from "../index.js";
import { requireAuth, setCors } from "../_lib/auth.js";

export default async function handler(req, res) {
  setCors(res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "PUT") {
    return res.status(405).json({
      sucesso: false,
      mensagem: "Método não permitido."
    });
  }

  const usuarioToken = requireAuth(req, res);
  if (!usuarioToken) return;

  try {
    const { nome, email } = req.body || {};
    const nomeLimpo = String(nome || "").trim();
    const emailLimpo = String(email || "").trim().toLowerCase();

    if (!nomeLimpo || !emailLimpo) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Nome e e-mail são obrigatórios."
      });
    }

    const db = await connectToDatabase();
    const { ObjectId } = await import("mongodb");
    const id = new ObjectId(usuarioToken.id);

    const outro = await db.collection("usuarios").findOne({
      email: emailLimpo,
      _id: { $ne: id },
      ativo: { $ne: false }
    });

    if (outro) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Este e-mail já está cadastrado."
      });
    }

    const resultado = await db.collection("usuarios").findOneAndUpdate(
      { _id: id, ativo: { $ne: false } },
      {
        $set: {
          nome: nomeLimpo,
          email: emailLimpo,
          atualizadoEm: new Date()
        }
      },
      { returnDocument: "after", projection: { senha: 0 } }
    );

    if (!resultado) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Usuário não encontrado."
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: "Perfil atualizado com sucesso!",
      usuario: {
        id: resultado._id.toString(),
        nome: resultado.nome,
        email: resultado.email
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao editar perfil."
    });
  }
}
