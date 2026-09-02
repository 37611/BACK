const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true, minlength: 2 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  senha: { type: String, required: true, minlength: 6, select: false },
  ativo: { type: Boolean, default: true, index: true },
  tokenRedefinicaoSenha: { type: String, select: false },
  tokenRedefinicaoExpira: { type: Date, select: false }
}, { timestamps: true });

userSchema.pre("save", async function(next) {
  if (!this.isModified("senha")) return next();
  this.senha = await bcrypt.hash(this.senha, 10);
  next();
});

userSchema.methods.senhaCorreta = function(senha) {
  return bcrypt.compare(senha, this.senha);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);