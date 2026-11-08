CREATE TABLE "youtube_analitica_desgloses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"clave" text NOT NULL,
	"views" integer,
	"minutos_vistos" integer,
	"porcentaje" double precision,
	"desde" date NOT NULL,
	"hasta" date NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "youtube_analitica_desgloses_key" UNIQUE("account_id","tipo","clave")
);
--> statement-breakpoint
ALTER TABLE "youtube_analitica_desgloses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "youtube_analitica_dias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"day" date NOT NULL,
	"views" integer,
	"engaged_views" integer,
	"minutos_vistos" integer,
	"duracion_media" integer,
	"likes" integer,
	"comments" integer,
	"shares" integer,
	"suscriptores_ganados" integer,
	"suscriptores_perdidos" integer,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "youtube_analitica_dias_account_day_key" UNIQUE("account_id","day")
);
--> statement-breakpoint
ALTER TABLE "youtube_analitica_dias" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "youtube_analitica_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"views" integer,
	"engaged_views" integer,
	"minutos_vistos" integer,
	"duracion_media" integer,
	"porcentaje_visto" double precision,
	"likes" integer,
	"comments" integer,
	"shares" integer,
	"suscriptores_ganados" integer,
	"suscriptores_perdidos" integer,
	"desde" date NOT NULL,
	"hasta" date NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "youtube_analitica_videos_post_key" UNIQUE("post_id")
);
--> statement-breakpoint
ALTER TABLE "youtube_analitica_videos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD COLUMN "scopes" text;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD COLUMN "analitica_verificada_en" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "youtube_analitica_desgloses" ADD CONSTRAINT "youtube_analitica_desgloses_account_id_social_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."social_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_analitica_dias" ADD CONSTRAINT "youtube_analitica_dias_account_id_social_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."social_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_analitica_videos" ADD CONSTRAINT "youtube_analitica_videos_post_id_social_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."social_posts"("id") ON DELETE cascade ON UPDATE no action;