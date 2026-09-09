import { getPayload } from 'payload';
import config from '../src/payload.config';

// Only the public taxonomy is seeded. Articles, accounts and referral data stay in the CMS.
const categories = [
  { slug: 'global-accounts', title: '账户与支付', summary: '银行卡、全球账户与 AI 订阅', description: '我把银行卡、全球账户和 AI 订阅的实操放在一起，记录开户、充值、付款和账单费用。', sortOrder: 0 },
  { slug: 'esim', title: 'eSIM 保号', summary: '开通、保号与使用记录', description: '整理海外号码的开通、套餐、保号和使用记录。', sortOrder: 1 },
] as const;

const payload = await getPayload({ config });
try {
  for (const category of categories) {
    const existing = await payload.find({ collection: 'categories', where: { slug: { equals: category.slug } }, limit: 1 });
    if (!existing.totalDocs) await payload.create({ collection: 'categories', data: category });
  }
  console.log('Category setup complete. Existing content was preserved.');
} finally {
  await payload.destroy();
}
process.exit(0);
