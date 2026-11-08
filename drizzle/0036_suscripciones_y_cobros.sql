CREATE TABLE "cobros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid,
	"suscripcion_id" uuid,
	"externo_id" text NOT NULL,
	"pago_id" text,
	"monto_clp" integer NOT NULL,
	"estado_pago" text,
	"detalle" text,
	"estado_cobro" text,
	"cobrado_en" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cobros" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "suscripciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid,
	"proveedor" text DEFAULT 'mercadopago' NOT NULL,
	"externo_id" text,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"plan" text NOT NULL,
	"monto_clp" integer NOT NULL,
	"correo_pagador" text NOT NULL,
	"con_prueba" boolean DEFAULT false NOT NULL,
	"enlace" text,
	"proximo_cobro" timestamp with time zone,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizada_en" timestamp with time zone DEFAULT now() NOT NULL,
	"cancelada_en" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "suscripciones" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cobros" ADD CONSTRAINT "cobros_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cobros" ADD CONSTRAINT "cobros_suscripcion_id_suscripciones_id_fk" FOREIGN KEY ("suscripcion_id") REFERENCES "public"."suscripciones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_plan_planes_clave_fk" FOREIGN KEY ("plan") REFERENCES "public"."planes"("clave") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cobros_externo_key" ON "cobros" USING btree ("externo_id");--> statement-breakpoint
CREATE INDEX "cobros_owner_idx" ON "cobros" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "suscripciones_externo_key" ON "suscripciones" USING btree ("externo_id");--> statement-breakpoint
CREATE INDEX "suscripciones_owner_idx" ON "suscripciones" USING btree ("owner_id");