import { assetUrl } from './cdn';

// Homepage quick-reference data. Promo terms change often: check the issuer's current rules before editing.
// Checked 2026-09-25: Starryblu vouchers (blog.starryblu.com), Bybit EU flat 1% (2026-06-02 notice) and first-month
// subscription campaign (listed until 2026-09-30); Gate 1% and MEXC 4% come from the site's own September articles.
export type Offer = {
  slug: string; name: string; brand: string; card: string; cardAlt: string; requirement: string; warn?: boolean;
  figure: string; figureNote: string; promo?: string; perk: string; code: string;
};

export const offers: Offer[] = [
  { slug: 'starryblu', name: 'Starryblu', brand: 'app-starryblu', card: 'starryblu', cardAlt: 'Starryblu Saturn 万事达卡', requirement: '护照 + 86 手机号',
    figure: '随机立减', figureNote: '每月 $10 券起', perk: 'OCBC 同名账户，可提现回支付宝', code: 'MWZK02Z' },
  { slug: 'bybit-eu', name: 'Bybit EU 万事达卡', brand: 'app-bybit', card: 'bybit-eu', cardAlt: 'Bybit EU 万事达借记卡', requirement: '需要欧洲地址', warn: true,
    figure: '1%', figureNote: '日常返现，不封顶', promo: '首月订阅 100% 返现，封顶 €50', perk: '持牌欧洲卡，0 月费、0 开卡费', code: '64M56KR' },
  { slug: 'gate-card', name: 'Gate U 卡', brand: 'app-gate', card: 'gate', cardAlt: 'Gate Visa Platinum 卡', requirement: '大陆身份证可开',
    figure: '1%', figureNote: '日常返现，月封顶 5U', perk: '美元账单按原价扣，无外汇费', code: 'VFYXVVSOAA' },
  { slug: 'mexc-card', name: 'MEXC 黑卡', brand: 'app-mexc', card: 'mexc', cardAlt: 'MEXC Visa Platinum 黑卡', requirement: '中国护照可开',
    figure: '4%', figureNote: '返现起步，月封顶 100U', perk: '开卡费、年费、充值费全免', code: '45Nji' },
];

export const saily = { slug: 'saily', title: 'Saily 美国手机号', note: '开通、Apple Pay 扣款、号段查询与接码实测。', price: '$6.99', priceNote: '首年年付', code: '0XMASON' };

export const brandNames: Record<string, string> = {
  saily: 'Saily', xesim: 'Xesim', dito: 'DITO', maya: 'Maya', csl: 'CSL', '3hk': '3HK', clubsim: 'Club Sim', lebara: 'Lebara', o2: 'O2',
};

export const esimGuides = [
  { slug: 'xesim', title: 'Xesim X2 Pro', note: '国行 iPhone 写入 eSIM，香港 CSL、英国 Lebara、德国 O2 保号。', brands: ['xesim', 'csl', 'lebara', 'o2'] },
  { slug: 'dito-maya', title: 'DITO eSIM + Maya', note: '菲律宾号码充值保号，护照开 Maya 数字银行。', brands: ['dito', 'maya'] },
  { slug: 'hk-sim', title: '香港手机卡横评', note: 'CSL、3HK DIY、Clubsim 的费用、漫游和续期条件。', brands: ['csl', '3hk', 'clubsim'] },
];

// Staggered three-column logo wall beside the eSIM list.
export const esimWall = [['saily', '3hk', 'o2'], ['dito', 'maya', 'lebara'], ['xesim', 'clubsim', 'csl']];

// Hero stage: U-card fan (back to front) plus one floating chip per other topic.
export const heroCards = ['bybit-eu', 'mexc', 'gate', 'starryblu'];
export const heroChips = [
  { title: '全球账户', note: '香港 · 澳门 · 新加坡', icons: ['zabank', 'antbank', 'hsbc'] },
  { title: 'eSIM', note: '美国 · 香港 · 菲律宾 · 英国', icons: ['saily', 'csl', 'dito', 'lebara'] },
];

export const marquee = [
  ['Starryblu', 'U 卡'], ['Bybit EU', 'U 卡'], ['Gate', 'U 卡'], ['MEXC', 'U 卡'], ['澳门蚂蚁银行', '账户'], ['众安银行', '账户'],
  ['Saily', 'eSIM'], ['Xesim', 'eSIM'], ['DITO', 'eSIM'], ['CSL', 'eSIM'], ['ChatGPT', '订阅'], ['Claude', '订阅'],
] as const;

export const brandIcon = (key: string) => assetUrl(`images/brands/${key.startsWith('app-') ? key : `app-${key}`}.png`);
export const cardImage = (key: string) => assetUrl(`images/cards/${key}.png`);
