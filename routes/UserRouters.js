const express = require("express");
const router = express.Router();

const {
  cadastrar, login, perfil, listar, editar, desativar, esqueciSenha, redefinirSenha
} = require("../controllers/userController");

const autenticar = require("../middleware/auth");

// Públicas
router.post("/cadastrar", cadastrar);
router.post("/login", login);
router.post("/esqueci-senha", esqueciSenha);
router.post("/redefinir-senha", redefinirSenha);

// Privadas
router.get("/", autenticar, listar);
router.get("/perfil", autenticar, perfil);
router.put("/editar", autenticar, editar);
router.delete("/desativar", autenticar, desativar);

module.exports = router;