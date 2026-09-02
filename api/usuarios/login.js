import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "../index.js";
import { setCors } from "../_lib/auth.js";

export default async function handler(req, res) {
  setCors(res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      sucesso: false,
      mensagem: "Método não permitido."
    });
  }

  try {
    const { email, senha } = req.body || {};
    const emailLimpo = String(email || "").trim().toLowerCase();
    const senhaLimpa = String(senha || "");

    if (!emailLimpo || !senhaLimpa) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "E-mail e senha são obrigatórios."
      });
    }

    const db = await connectToDatabase();
    const usuario = await db.collection("usuarios").findOne({ email: emailLimpo });

    if (!usuario || usuario.ativo === false) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "E-mail ou senha incorretos."
      });
    }

    const senhaValida = await bcrypt.compare(senhaLimpa, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "E-mail ou senha incorretos."
      });
    }

    const segredo = process.env.JWT_SECRET;
    if (!segredo) {
      throw new Error("JWT_SECRET não configurado.");
    }

    const token = jwt.sign(
      {
        id: usuario._id.toString(),
        email: usuario.email
      },
      segredo,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Login realizado com sucesso!",
      token,
      usuario: {
        id: usuario._id.toString(),
        nome: usuario.nome,
        email: usuario.email
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao realizar login."
    });
  }
}
