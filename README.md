# T-licX Admin Panel

Basic instructions to run and deploy the project.

## Environment
Create a `.env` file in the project root (do not commit it). Use `.env.example` as a template.

Required vars:
- `DATABASE_URL` — Postgres connection string
- `BASE_URL` — Public base URL (used for emails and redirects)
- `MERCHANT_ID` — Sepay merchant ID
- `SECRET_KEY` — Secret used for signing
- `RESEND_API_KEY` — Resend API key for sending emails
- `SEPAY_WEBHOOK_SECRET` — (optional) webhook secret for Sepay

## Local development
Install dependencies:

```bash
npm install
```

Start the app locally:

```bash
node app.js
# or
PORT=4001 node app.js
```

## Deployment (Vercel)
1. Link project to Vercel: `vercel link` (if not already linked).
2. Set the required Environment Variables in your Vercel project settings (or `vercel env add`): `DATABASE_URL`, `MERCHANT_ID`, `SECRET_KEY`, `RESEND_API_KEY`, `BASE_URL`, `SEPAY_WEBHOOK_SECRET`.
3. Deploy to production:

```bash
vercel --prod
```

## Security checklist before deploy
- Ensure `.env` is in `.gitignore`.
- Never store API keys or secrets in source files. Use environment variables.

## Backup
A simple backup of `my-brain/brain.db` can be created by copying it to a safe place. Example:

```bash
cp my-brain/brain.db backups/brain.db.YYYYMMDD_HHMM.db
```

## Contact
If you need help, open an issue or contact the maintainer.
