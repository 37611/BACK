const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Usuario = require("../models/User");
const { enviarEmailRedefinicao } = require("../utils/email");

const gerarToken = (id) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET não configurado.");
  return jwt.sign({ id: id.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
};

const cadastrar = async (req, res) => {
  try {
    const { nome, email, senha } = req.body || {};
    const n = String(nome || "").trim();
    const e = String(email || "").trim().toLowerCase();
    const s = String(senha || "");

    if (!n || !e || !s) return res.status(400).json({ sucesso:false, mensagem:"Nome, e-mail e senha são obrigatórios." });
    if (s.length < 6) return res.status(400).json({ sucesso:false, mensagem:"A senha deve ter pelo menos 6 caracteres." });

    const existente = await Usuario.findOne({ email: e });
    if (existente && existente.ativo) return res.status(400).json({ sucesso:false, mensagem:"Este e-mail já está cadastrado." });

    let usuario;
    if (existente) {
      existente.nome = n; existente.senha = s; existente.ativo = true;
      usuario = await existente.save();
    } else {
      usuario = await Usuario.create({ nome:n, email:e, senha:s, ativo:true });
    }

    const token = gerarToken(usuario._id);
    return res.status(201).json({
      sucesso:true, mensagem:"Usuário cadastrado com sucesso!", token,
      usuario:{ id:usuario._id.toString(), nome:usuario.nome, email:usuario.email }
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ sucesso:false, mensagem:"Erro interno no servidor." });
  }
};

const login = async (req, res) => {
  try {
    const { email, senha } = req.body || {};
    const e = String(email || "").trim().toLowerCase();
    if (!e || !senha) return res.status(400).json({ sucesso:false, mensagem:"E-mail e senha são obrigatórios." });

    const usuario = await Usuario.findOne({ email:e, ativo:true }).select("+senha");
    if (!usuario || !(await usuario.senhaCorreta(senha))) {
      return res.status(401).json({ sucesso:false, mensagem:"E-mail ou senha inválidos." });
    }

    const token = gerarToken(usuario._id);
    return res.status(200).json({
      sucesso:true, mensagem:"Login realizado com sucesso!", token,
      usuario:{ id:usuario._id.toString(), nome:usuario.nome, email:usuario.email }
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ sucesso:false, mensagem:"Erro interno no servidor." });
  }
};

const perfil = async (req,res) => res.status(200).json({
  sucesso:true,
  usuario:{ id:req.usuario._id.toString(), nome:req.usuario.nome, email:req.usuario.email, criadoEm:req.usuario.createdAt }
});

const listar = async (req,res) => {
  try {
    const usuarios = await Usuario.find({ ativo:true }).sort({ createdAt:-1 }).select("-senha -tokenRedefinicaoSenha -tokenRedefinicaoExpira");
    return res.status(200).json({
      sucesso:true, total:usuarios.length,
      usuarios:usuarios.map(u=>({ id:u._id.toString(), nome:u.nome, email:u.email, criadoEm:u.createdAt }))
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ sucesso:false, mensagem:"Erro interno no servidor." });
  }
};

const editar = async (req,res) => {
  try {
    const { nome, email } = req.body || {};
    const dados = {};
    if (nome !== undefined && String(nome).trim()) dados.nome = String(nome).trim();
    if (email !== undefined && String(email).trim()) dados.email = String(email).trim().toLowerCase();

    if (!Object.keys(dados).length) return res.status(400).json({ sucesso:false, mensagem:"Informe ao menos um campo para atualizar (nome ou e-mail)." });

    if (dados.email) {
      const emUso = await Usuario.findOne({ email:dados.email, _id:{ $ne:req.usuario._id }, ativo:true });
      if (emUso) return res.status(400).json({ sucesso:false, mensagem:"Este e-mail já está em uso por outro usuário." });
    }

    const atualizado = await Usuario.findByIdAndUpdate(req.usuario._id, dados, { new:true, runValidators:true });
    return res.status(200).json({
      sucesso:true, mensagem:"Dados atualizados com sucesso!",
      usuario:{ id:atualizado._id.toString(), nome:atualizado.nome, email:atualizado.email }
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ sucesso:false, mensagem:"Erro interno no servidor." });
  }
};

const desativar = async (req,res) => {
  try {
    await Usuario.findByIdAndUpdate(req.usuario._id, { ativo:false });
    return res.status(200).json({ sucesso:true, mensagem:"Conta desativada com sucesso." });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ sucesso:false, mensagem:"Erro interno no servidor." });
  }
};

const esqueciSenha = async (req,res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ sucesso:false, mensagem:"Informe o e-mail cadastrado." });
    const usuario = await Usuario.findOne({ email:String(email).trim().toLowerCase(), ativo:true }).select("+tokenRedefinicaoSenha +tokenRedefinicaoExpira");
    if (!usuario) return res.status(200).json({ sucesso:true, mensagem:"Se este e-mail estiver cadastrado, você receberá as instruções em breve." });

    const token = crypto.randomBytes(32).toString("hex");
    usuario.tokenRedefinicaoSenha = token;
    usuario.tokenRedefinicaoExpira = new Date(Date.now()+3600000);
    await usuario.save({ validateBeforeSave:false });
    await enviarEmailRedefinicao(usuario.email, usuario.nome, token);

    return res.status(200).json({ sucesso:true, mensagem:"Se este e-mail estiver cadastrado, você receberá as instruções em breve." });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ sucesso:false, mensagem:"Erro ao enviar e-mail. Tente novamente." });
  }
};

const redefinirSenha = async (req,res) => {
  try {
    const { token, novaSenha } = req.body || {};
    if (!token || !novaSenha) return res.status(400).json({ sucesso:false, mensagem:"Token e nova senha são obrigatórios." });
    if (String(novaSenha).length < 6) return res.status(400).json({ sucesso:false, mensagem:"A nova senha deve ter pelo menos 6 caracteres." });

    const usuario = await Usuario.findOne({
      tokenRedefinicaoSenha:token,
      tokenRedefinicaoExpira:{ $gt:new Date() },
      ativo:true
    }).select("+tokenRedefinicaoSenha +tokenRedefinicaoExpira +senha");

    if (!usuario) return res.status(400).json({ sucesso:false, mensagem:"Token inválido ou expirado. Solicite um novo link." });

    usuario.senha = novaSenha;
    usuario.tokenRedefinicaoSenha = undefined;
    usuario.tokenRedefinicaoExpira = undefined;
    await usuario.save();

    return res.status(200).json({
      sucesso:true, mensagem:"Senha redefinida com sucesso!", token:gerarToken(usuario._id),
      usuario:{ id:usuario._id.toString(), nome:usuario.nome, email:usuario.email }
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ sucesso:false, mensagem:"Erro interno no servidor." });
  }
};

module.exports = { cadastrar, login, perfil, listar, editar, desativar, esqueciSenha, redefinirSenha };