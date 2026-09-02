const jwt = require("jsonwebtoken");
const Usuario = require("../models/User");

async function autenticar(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ sucesso: false, mensagem: "Token não informado." });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ sucesso: false, mensagem: "JWT_SECRET não configurado." });
    }

    const token = header.slice(7).trim();
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findOne({ _id: decodificado.id, ativo: true });

    if (!usuario) {
      return res.status(401).json({ sucesso: false, mensagem: "Usuário não encontrado ou conta desativada." });
    }

    req.usuario = usuario;
    next();
  } catch {
    return res.status(401).json({ sucesso: false, mensagem: "Token inválido ou expirado." });
  }
}

module.exports = autenticar;