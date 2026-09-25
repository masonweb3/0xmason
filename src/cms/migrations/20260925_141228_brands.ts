import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Adds 品牌 (brands) for the homepage hero and links the brands of the articles already published.
// Seeded brands use site assets (icon_asset / card_asset); ones created in the admin upload media instead.
// created_at sets display order: newest first, and the newest card sits in front of the fan.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "cms"."enum_brands_kind" AS ENUM('card', 'account', 'esim');
  CREATE TABLE "cms"."brands" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"kind" "cms"."enum_brands_kind" NOT NULL,
  	"logo_id" integer,
  	"card_image_id" integer,
  	"icon_asset" varchar,
  	"card_asset" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."brands_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"articles_id" integer
  );
  
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD COLUMN "brands_id" integer;
  ALTER TABLE "cms"."brands" ADD CONSTRAINT "brands_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."brands" ADD CONSTRAINT "brands_card_image_id_media_id_fk" FOREIGN KEY ("card_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."brands_rels" ADD CONSTRAINT "brands_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."brands_rels" ADD CONSTRAINT "brands_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "cms"."articles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "brands_logo_idx" ON "cms"."brands" USING btree ("logo_id");
  CREATE INDEX "brands_card_image_idx" ON "cms"."brands" USING btree ("card_image_id");
  CREATE INDEX "brands_updated_at_idx" ON "cms"."brands" USING btree ("updated_at");
  CREATE INDEX "brands_created_at_idx" ON "cms"."brands" USING btree ("created_at");
  CREATE INDEX "brands_rels_order_idx" ON "cms"."brands_rels" USING btree ("order");
  CREATE INDEX "brands_rels_parent_idx" ON "cms"."brands_rels" USING btree ("parent_id");
  CREATE INDEX "brands_rels_path_idx" ON "cms"."brands_rels" USING btree ("path");
  CREATE INDEX "brands_rels_articles_id_idx" ON "cms"."brands_rels" USING btree ("articles_id");
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "cms"."brands"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_brands_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("brands_id");

  -- Same boundary as 20260910_000000_private_cms_access for the new tables.
  ALTER TABLE "cms"."brands" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."brands_rels" ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON "cms"."brands", "cms"."brands_rels" FROM PUBLIC;
  REVOKE ALL ON SEQUENCE "cms"."brands_id_seq", "cms"."brands_rels_id_seq" FROM PUBLIC;
  DO $$
  DECLARE item record;
  BEGIN
    FOR item IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated') LOOP
      EXECUTE format('REVOKE ALL ON cms.brands, cms.brands_rels FROM %I', item.rolname);
      EXECUTE format('REVOKE ALL ON SEQUENCE cms.brands_id_seq, cms.brands_rels_id_seq FROM %I', item.rolname);
    END LOOP;
  END $$;

  WITH seed (name, kind, icon, card, slugs, age) AS (VALUES
    ('Starryblu', 'card', 'starryblu', 'starryblu', ARRAY['starryblu'], 0),
    ('Gate', 'card', 'gate', 'gate', ARRAY['gate-card'], 1),
    ('MEXC', 'card', 'mexc', 'mexc', ARRAY['mexc-card'], 2),
    ('Bybit EU', 'card', 'bybit', 'bybit-eu', ARRAY['bybit-eu'], 3),
    ('众安银行', 'account', 'zabank', NULL, ARRAY['hong-kong-banking'], 10),
    ('澳门蚂蚁银行', 'account', 'antbank', NULL, ARRAY['antbank-macao'], 11),
    ('汇丰香港', 'account', 'hsbc', NULL, ARRAY['hong-kong-banking'], 12),
    ('恒生银行', 'account', 'hangseng', NULL, ARRAY['hong-kong-banking'], 13),
    ('Maya', 'account', 'maya', NULL, ARRAY['dito-maya'], 14),
    ('Saily', 'esim', 'saily', NULL, ARRAY['saily'], 20),
    ('CSL', 'esim', 'csl', NULL, ARRAY['hk-sim', 'xesim'], 21),
    ('DITO', 'esim', 'dito', NULL, ARRAY['dito-maya'], 22),
    ('Lebara', 'esim', 'lebara', NULL, ARRAY['xesim'], 23),
    ('Xesim', 'esim', 'xesim', NULL, ARRAY['xesim'], 24),
    ('3HK', 'esim', '3hk', NULL, ARRAY['hk-sim'], 25),
    ('Club Sim', 'esim', 'clubsim', NULL, ARRAY['hk-sim'], 26),
    ('O2', 'esim', 'o2', NULL, ARRAY['xesim'], 27)
  ), inserted AS (
    INSERT INTO "cms"."brands" ("name", "kind", "icon_asset", "card_asset", "created_at", "updated_at")
    SELECT name, kind::"cms"."enum_brands_kind", 'images/brands/app-' || icon || '.png',
      'images/cards/' || card || '.png', now() - make_interval(secs => age), now()
    FROM seed
    RETURNING "id", "name"
  )
  INSERT INTO "cms"."brands_rels" ("parent_id", "path", "articles_id", "order")
  SELECT inserted.id, 'articles', article.id, linked.position::integer
  FROM inserted
  JOIN seed ON seed.name = inserted.name
  CROSS JOIN LATERAL unnest(seed.slugs) WITH ORDINALITY AS linked (slug, position)
  JOIN "cms"."articles" AS article ON article.slug = linked.slug;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE "cms"."brands" CASCADE;
  DROP TABLE "cms"."brands_rels" CASCADE;
  ALTER TABLE "cms"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_brands_fk";
  DROP INDEX "cms"."payload_locked_documents_rels_brands_id_idx";
  ALTER TABLE "cms"."payload_locked_documents_rels" DROP COLUMN "brands_id";
  DROP TYPE "cms"."enum_brands_kind";`)
}
