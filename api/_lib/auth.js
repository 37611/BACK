import jwt from "jsonwebtoken";

export function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export function getToken(req) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

export function requireAuth(req, res) {
  const segredo = process.env.JWT_SECRET;

  if (!segredo) {
    res.status(500).json({
      sucesso: false,
      mensagem: "JWT_SECRET não configurado no servidor."
    });
    return null;
  }

  const token = getToken(req);

  if (!token) {
    res.status(401).json({
      sucesso: false,
      mensagem: "Token não informado."
    });
    return null;
  }

  try {
    return jwt.verify(token, segredo);
  } catch {
    res.status(401).json({
      sucesso: false,
      mensagem: "Token inválido ou expirado."
    });
    return null;
  }
}
