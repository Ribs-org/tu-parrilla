CREATE TABLE "preguntas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comanda_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"texto" text NOT NULL,
	"opciones" jsonb,
	"plazo" timestamp with time zone NOT NULL,
	"por_defecto" text NOT NULL,
	"estado_previo" text NOT NULL,
	"respuesta" text,
	"respondida_en" timestamp with time zone,
	"por_plazo" boolean DEFAULT false NOT NULL,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "preguntas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "comandas" ADD COLUMN "alarma_recibida_en" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "comandas" ADD COLUMN "alarma_eta" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "preguntas" ADD CONSTRAINT "preguntas_comanda_id_comandas_id_fk" FOREIGN KEY ("comanda_id") REFERENCES "public"."comandas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preguntas" ADD CONSTRAINT "preguntas_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "preguntas_comanda_idx" ON "preguntas" USING btree ("comanda_id","creada_en");--> statement-breakpoint
CREATE UNIQUE INDEX "preguntas_abierta_key" ON "preguntas" USING btree ("comanda_id") WHERE respondida_en is null;--> statement-breakpoint
CREATE INDEX "preguntas_plazo_idx" ON "preguntas" USING btree ("plazo") WHERE respondida_en is null;