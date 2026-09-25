import * as migration_20260909_145718_initial_cms from './20260909_145718_initial_cms';
import * as migration_20260909_163849_merge_payment_categories from './20260909_163849_merge_payment_categories';
import * as migration_20260909_170323_responsive_webp_images from './20260909_170323_responsive_webp_images';
import * as migration_20260910_000000_private_cms_access from './20260910_000000_private_cms_access';
import * as migration_20260925_120000_ai_reviews_category from './20260925_120000_ai_reviews_category';

export const migrations = [
  {
    up: migration_20260909_145718_initial_cms.up,
    down: migration_20260909_145718_initial_cms.down,
    name: '20260909_145718_initial_cms',
  },
  {
    up: migration_20260909_163849_merge_payment_categories.up,
    down: migration_20260909_163849_merge_payment_categories.down,
    name: '20260909_163849_merge_payment_categories',
  },
  {
    up: migration_20260909_170323_responsive_webp_images.up,
    down: migration_20260909_170323_responsive_webp_images.down,
    name: '20260909_170323_responsive_webp_images'
  },
  {
    up: migration_20260910_000000_private_cms_access.up,
    down: migration_20260910_000000_private_cms_access.down,
    name: '20260910_000000_private_cms_access',
  },
  {
    up: migration_20260925_120000_ai_reviews_category.up,
    down: migration_20260925_120000_ai_reviews_category.down,
    name: '20260925_120000_ai_reviews_category',
  },
];
