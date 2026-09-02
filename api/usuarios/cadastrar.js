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
    const { nome, email, senha } = req.body || {};
    const nomeLimpo = String(nome || "").trim();
    const emailLimpo = String(email || "").trim().toLowerCase();
    const senhaLimpa = String(senha || "");

    if (!nomeLimpo || !emailLimpo || !senhaLimpa) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Nome, e-mail e senha são obrigatórios."
      });
    }

    if (senhaLimpa.length < 6) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A senha deve ter pelo menos 6 caracteres."
      });
    }

    const db = await connectToDatabase();
    const colecao = db.collection("usuarios");

    const existente = await colecao.findOne({ email: emailLimpo });

    if (existente && existente.ativo !== false) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Este e-mail já está cadastrado."
      });
    }

    const senhaHash = await bcrypt.hash(senhaLimpa, 10);

    let usuario;

    if (existente) {
      await colecao.updateOne(
        { _id: existente._id },
        {
          $set: {
            nome: nomeLimpo,
            email: emailLimpo,
            senha: senhaHash,
            ativo: true,
            atualizadoEm: new Date()
          }
        }
      );
      usuario = await colecao.findOne({ _id: existente._id });
    } else {
      const resultado = await colecao.insertOne({
        nome: nomeLimpo,
        email: emailLimpo,
        senha: senhaHash,
        ativo: true,
        criadoEm: new Date()
      });
      usuario = await colecao.findOne({ _id: resultado.insertedId });
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

    return res.status(201).json({
      sucesso: true,
      mensagem: "Conta criada com sucesso!",
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
      mensagem: "Erro ao cadastrar usuário."
    });
  }
}
