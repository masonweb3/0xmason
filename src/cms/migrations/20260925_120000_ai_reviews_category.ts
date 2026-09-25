import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Adds the AI 测评 category and moves the Opus review into it. The old URL redirects to the new one
// through the article page's canonical lookup. Run only after the code that knows this category is live.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cms"."categories" ALTER COLUMN "slug" SET DATA TYPE text;
  DROP TYPE "cms"."enum_categories_slug";
  CREATE TYPE "cms"."enum_categories_slug" AS ENUM('global-accounts', 'esim', 'ai-reviews');
  ALTER TABLE "cms"."categories" ALTER COLUMN "slug" SET DATA TYPE "cms"."enum_categories_slug" USING "slug"::"cms"."enum_categories_slug";
  INSERT INTO "cms"."categories" ("title", "slug", "summary", "description", "sort_order")
    VALUES ('AI 测评', 'ai-reviews', 'AI 模型与订阅的实测对比',
      '同一道题交给不同模型，记录耗时、费用和结果，以及订阅怎么付款。', 2)
    ON CONFLICT ("slug") DO NOTHING;
  UPDATE "cms"."articles" AS article SET "category_id" = target.id
    FROM "cms"."categories" AS target
    WHERE target.slug = 'ai-reviews' AND article.slug = 'opus-5-5-vs-gpt-6-astra';
  UPDATE "cms"."_articles_v" AS version SET "version_category_id" = target.id
    FROM "cms"."categories" AS target
    WHERE target.slug = 'ai-reviews' AND version.version_slug = 'opus-5-5-vs-gpt-6-astra';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  UPDATE "cms"."articles" AS article SET "category_id" = target.id
    FROM "cms"."categories" AS target
    WHERE target.slug = 'global-accounts' AND article.slug = 'opus-5-5-vs-gpt-6-astra';
  UPDATE "cms"."_articles_v" AS version SET "version_category_id" = target.id
    FROM "cms"."categories" AS target
    WHERE target.slug = 'global-accounts' AND version.version_slug = 'opus-5-5-vs-gpt-6-astra';
  DELETE FROM "cms"."categories" WHERE "slug" = 'ai-reviews';
   ALTER TABLE "cms"."categories" ALTER COLUMN "slug" SET DATA TYPE text;
  DROP TYPE "cms"."enum_categories_slug";
  CREATE TYPE "cms"."enum_categories_slug" AS ENUM('global-accounts', 'esim');
  ALTER TABLE "cms"."categories" ALTER COLUMN "slug" SET DATA TYPE "cms"."enum_categories_slug" USING "slug"::"cms"."enum_categories_slug";`)
}
