# Backend Vercel + MongoDB

## 1. Instalar

```bash
npm install
```

## 2. Testar localmente

Instale a CLI da Vercel se necessário:

```bash
npm install -g vercel
```

Depois:

```bash
vercel dev
```

A API ficará disponível em:

```text
http://localhost:3000/api
```

Ela retorna:

```json
{
  "sucesso": true,
  "mensagem": "API funcionando! 🚀",
  "versao": "1.0.0"
}
```

## 3. MongoDB

Crie um arquivo `.env.local` baseado no `.env.example`:

```text
MONGODB_URI=sua_connection_string
MONGODB_DB=meu_banco
```

A rota `/api/usuarios` consulta a coleção `usuarios`.

## 4. Publicar na Vercel

Suba esta pasta para um repositório GitHub e importe o projeto na Vercel.

Em **Project Settings > Environment Variables**, adicione:

- `MONGODB_URI`
- `MONGODB_DB`

Depois faça o deploy.

A URL será parecida com:

```text
https://seu-projeto.vercel.app/api
```

E a consulta ao MongoDB:

```text
https://seu-projeto.vercel.app/api/usuarios
```

Nunca coloque sua senha do MongoDB diretamente no código ou no GitHub.
