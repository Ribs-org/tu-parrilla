ALTER TABLE "comandas" ADD COLUMN "entrega_vista" text;--> statement-breakpoint
-- Lo que ya se entregó antes de la animación cuenta como visto: si no, el primer día después del
-- despliegue saldrían de la cocina, de una vez, todas las comandas sirviendo o listas.
UPDATE "comandas" SET "entrega_vista" = "estado" WHERE "estado" IN ('sirviendo', 'lista');
