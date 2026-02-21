import { app } from "./app";

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(port, () => {
  console.log(`[migration-backend] listening on port ${port}`);
});