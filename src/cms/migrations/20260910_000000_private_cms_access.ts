import { type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    REVOKE ALL ON SCHEMA cms FROM PUBLIC;
    REVOKE ALL ON ALL TABLES IN SCHEMA cms FROM PUBLIC;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA cms FROM PUBLIC;
    ALTER DEFAULT PRIVILEGES IN SCHEMA cms REVOKE ALL ON TABLES FROM PUBLIC;
    ALTER DEFAULT PRIVILEGES IN SCHEMA cms REVOKE ALL ON SEQUENCES FROM PUBLIC;
    DO $$
    DECLARE item record;
    BEGIN
      FOR item IN SELECT tablename FROM pg_tables WHERE schemaname = 'cms' LOOP
        EXECUTE format('ALTER TABLE cms.%I ENABLE ROW LEVEL SECURITY', item.tablename);
      END LOOP;
      FOR item IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated') LOOP
        EXECUTE format('REVOKE ALL ON SCHEMA cms FROM %I', item.rolname);
        EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA cms FROM %I', item.rolname);
        EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA cms FROM %I', item.rolname);
      END LOOP;
    END $$;
  `);
}

export async function down(): Promise<void> {
  // Reverting application code must not restore anonymous database access.
}
