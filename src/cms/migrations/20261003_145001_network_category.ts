import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Adds the 网络工具 category. The enum is recreated instead of `ADD VALUE` because a value added
// that way cannot be used by the INSERT in the same transaction.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cms"."categories" ALTER COLUMN "slug" SET DATA TYPE text;
  DROP TYPE "cms"."enum_categories_slug";
  CREATE TYPE "cms"."enum_categories_slug" AS ENUM('global-accounts', 'esim', 'ai-reviews', 'network');
  ALTER TABLE "cms"."categories" ALTER COLUMN "slug" SET DATA TYPE "cms"."enum_categories_slug" USING "slug"::"cms"."enum_categories_slug";
  INSERT INTO "cms"."categories" ("title", "slug", "summary", "description", "sort_order")
    VALUES ('网络工具', 'network', '代理 App、家庭网关与节点配置',
      '我把代理 App、家里网关和节点的搭法放在一起，记录怎么配、踩过的坑和花了多少钱。', 3)
    ON CONFLICT ("slug") DO NOTHING;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DELETE FROM "cms"."categories" WHERE "slug" = 'network';
   ALTER TABLE "cms"."categories" ALTER COLUMN "slug" SET DATA TYPE text;
  DROP TYPE "cms"."enum_categories_slug";
  CREATE TYPE "cms"."enum_categories_slug" AS ENUM('global-accounts', 'esim', 'ai-reviews');
  ALTER TABLE "cms"."categories" ALTER COLUMN "slug" SET DATA TYPE "cms"."enum_categories_slug" USING "slug"::"cms"."enum_categories_slug";`)
}
