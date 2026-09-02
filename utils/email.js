const nodemailer = require("nodemailer");

async function enviarEmailRedefinicao(email, nome, token) {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Configuração de e-mail não definida.");
  }

  const port = Number(process.env.EMAIL_PORT || 587);
  const transporter = nodemailer.createTransport({
    host:process.env.EMAIL_HOST, port, secure:port === 465,
    auth:{ user:process.env.EMAIL_USER, pass:process.env.EMAIL_PASS }
  });

  const front = process.env.FRONT_URL || "http://localhost:5173";
  const link = `${front}/redefinir-senha?token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from:process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to:email,
    subject:"Redefinição de senha - Mural da Turma",
    text:`Olá, ${nome}. Link para redefinir sua senha: ${link}`,
    html:`<p>Olá, ${nome}.</p><p><a href="${link}">Redefinir senha</a></p><p>O link expira em 1 hora.</p>`
  });
}

module.exports = { enviarEmailRedefinicao };