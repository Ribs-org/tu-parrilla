-- El modo del panel y de la app del teléfono pasa a la cuenta (`users.tema`, en
-- `src/db/schema.ts`), para que el teléfono y el panel vayan juntos. Todas parten de noche,
-- que es la de entrada.
ALTER TABLE "users" ADD COLUMN "tema" text DEFAULT 'noche' NOT NULL;
