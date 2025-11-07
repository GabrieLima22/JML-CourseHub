# JML CourseHub – Backend

Guia rápido para instalar, configurar e rodar a API que atende o frontend React.

## Estrutura

```
jml-backend/
├── prisma/schema.prisma      # Modelos do banco (PostgreSQL + Prisma)
├── src/app.js                # Servidor Express configurado
├── src/controllers/          # Lógicas de domínio (ex: cursos)
├── src/routes/               # Rotas públicas e internas
├── uploads/                  # PDFs enviados (gitkeep para manter vazio)
├── package.json              # Scripts e dependências
└── .env.example              # Variáveis obrigatórias
```

## Variáveis de ambiente

1. Copie o arquivo de exemplo:
   ```bash
   cd jml-backend
   cp .env.example .env
   ```
2. Ajuste `DATABASE_URL` para o seu Postgres. Exemplo local:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jml_coursehub?schema=public"
   ```
3. Atualize `FRONTEND_URL`, `OPENAI_API_KEY` e `JWT_SECRET` conforme o ambiente.

## Instalação

```bash
cd jml-backend
npm install
npx prisma generate
npx prisma db push   # requer um banco PostgreSQL acessível
```

> Se ainda não tiver Postgres, suba um container rapidamente:
> ```bash
> docker run --name jml-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
> ```

## Scripts úteis

- `npm run dev` – inicia o servidor com Nodemon (porta 3001 por padrão)
- `npm start` – inicia em modo produção
- `npm run db:studio` – abre o Prisma Studio (CRUD visual)
- `npm run db:reset` – zera e recria o banco (atenção!)

## Endpoints principais

| Método | Rota                              | Descrição                              |
| ------ | --------------------------------- | -------------------------------------- |
| GET    | `/api/health`                     | Status geral do serviço                |
| GET    | `/api`                            | Metadados da API                       |
| GET    | `/api/courses`                    | Lista paginada com filtros             |
| GET    | `/api/courses/:id`                | Detalhes completos de um curso         |
| GET    | `/api/courses/:id/related`        | Recomendações                          |
| GET    | `/api/courses/stats`              | Estatísticas para dashboards           |
| GET    | `/api/courses/search/suggestions` | Sugestões para autocomplete            |
| GET    | `/api/upload`                     | Lista últimos uploads                  |
| POST   | `/api/upload/pdf`                 | Upload de PDF (usa multipart/form-data)|


## Fluxo de desenvolvimento

1. Criar/atualizar o banco via Prisma (`db push` ou migrations).
2. Iniciar o backend (`npm run dev`).
3. Consumir os endpoints no frontend (`http://localhost:3001/api/...`).
4. Monitorar logs no terminal para entender erros de validação ou Prisma.

## Dicas

- Se precisar alterar a estrutura das tabelas, edite `prisma/schema.prisma` e rode `npx prisma db push`.
- Os uploads são armazenados localmente em `uploads/pdfs/`. Para ambientes cloud considere mover para S3/Cloud Storage.
- O rate limit está habilitado (100 req / 15 min por IP). Ajuste em `src/app.js` se necessário.
- Use `res.apiResponse` e `res.apiError` (middleware global) para manter o padrão de respostas.
