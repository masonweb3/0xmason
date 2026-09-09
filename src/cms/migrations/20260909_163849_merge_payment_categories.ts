import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  INSERT INTO "cms"."categories" ("title", "slug", "summary", "description", "sort_order")
    SELECT '账户与支付', 'global-accounts', '银行卡、全球账户与 AI 订阅',
      '我把银行卡、全球账户和 AI 订阅的实操放在一起，记录开户、充值、付款和账单费用。', 0
    WHERE EXISTS (SELECT 1 FROM "cms"."categories" WHERE "slug" = 'ai-subscriptions')
    ON CONFLICT ("slug") DO NOTHING;
  UPDATE "cms"."articles" AS article SET "category_id" = target.id
    FROM "cms"."categories" AS legacy, "cms"."categories" AS target
    WHERE legacy.slug = 'ai-subscriptions' AND target.slug = 'global-accounts'
      AND article.category_id = legacy.id;
  UPDATE "cms"."_articles_v" AS version SET "version_category_id" = target.id
    FROM "cms"."categories" AS legacy, "cms"."categories" AS target
    WHERE legacy.slug = 'ai-subscriptions' AND target.slug = 'global-accounts'
      AND version.version_category_id = legacy.id;
  UPDATE "cms"."categories" SET "title" = '账户与支付',
    "summary" = '银行卡、全球账户与 AI 订阅',
    "description" = '我把银行卡、全球账户和 AI 订阅的实操放在一起，记录开户、充值、付款和账单费用。',
    "sort_order" = 0, "updated_at" = now()
    WHERE "slug" = 'global-accounts';
  UPDATE "cms"."categories" SET "sort_order" = 1 WHERE "slug" = 'esim';
  DELETE FROM "cms"."categories" WHERE "slug" = 'ai-subscriptions';
   ALTER TABLE "cms"."categories" ALTER COLUMN "slug" SET DATA TYPE text;
  DROP TYPE "cms"."enum_categories_slug";
  CREATE TYPE "cms"."enum_categories_slug" AS ENUM('global-accounts', 'esim');
  ALTER TABLE "cms"."categories" ALTER COLUMN "slug" SET DATA TYPE "cms"."enum_categories_slug" USING "slug"::"cms"."enum_categories_slug";
  ALTER TABLE "cms"."media" ALTER COLUMN "prefix" SET DEFAULT 'media';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Rollback restores the schema. Restore the database backup to undo merged classifications.
  await db.execute(sql`
   ALTER TYPE "cms"."enum_categories_slug" ADD VALUE 'ai-subscriptions' BEFORE 'esim';
  ALTER TABLE "cms"."media" ALTER COLUMN "prefix" SET DEFAULT '';`)
}
