export const informationPages = {
  about: {
    title: '关于 Mason',
    description: '了解 Mason、0xmason.com 的内容方向、实践记录与推荐链接披露方式',
    body: `我是 Mason，前产品经理，现在全职开发 AI 产品。我把账户与支付、eSIM 和订阅服务的操作记录整理在这里，也分享自己做的工具。

## 这里记录什么

[精选资源](/resources)中，账户与支付记录开户、充值、付款和账单；eSIM 保号记录选购、安装与号码维护。[CheckIP](https://checkip.0xmason.com/)提供 IP 查询和网络诊断。

文章中的金额、耗时和截图对应文中记录时的情况，服务价格、活动和界面会变化。请结合文章的记录与更新日期阅读，交易前再看服务商的当前页面。

## 推荐链接与编辑说明

部分文章包含推荐链接或邀请码，通过这些入口注册或购买，我可能获得佣金或奖励。相关页面会披露推荐关系；推荐奖励与产品的费用、限制分别说明。

本站是个人内容网站，与文中提到的银行、运营商和软件厂商没有隶属关系。内容提供操作参考，不承诺开户、审核、返现或投资结果。

## 更正与联系

发现失效链接、费用变更或内容错误，可以通过[联系页面](/contact)告诉我。请附上文章网址和需要更正的位置。`,
  },
  contact: {
    title: '联系 Mason',
    description: '通过 Mason 的公开账号反馈文章错误、网站问题、合作与隐私请求',
    body: `文章更正、合作和隐私相关问题，可以通过 [𝕏：@mason0x_](https://x.com/mason0x_) 联系我。

## 反馈文章或网站问题

请附上页面网址、问题发生的时间，以及具体段落或报错。网站代码问题也可以在 [GitHub](https://github.com/sabialab/0xmason/issues) 提交 issue。

GitHub issue 是公开的。请不要在反馈中贴护照、完整卡号、验证码、密码、银行文件或其他私密资料；截图先遮住个人信息。

## 内容与权利请求

如果你认为某段内容或图片涉及你的权利，请提供页面网址、对应内容和可供核对的来源。我会核对并处理更正或移除请求。

## 数据相关问题

有关主站的数据处理方式，请先阅读[隐私政策](/privacy)。CheckIP 的网络诊断会产生不同的第三方请求，详见 [CheckIP 隐私政策](https://checkip.0xmason.com/privacy)。`,
  },
  privacy: {
    title: '隐私政策',
    description: '0xmason.com 的访问数据、浏览器存储、推荐链接、第三方服务与广告隐私说明',
    body: `本页说明由 Mason 维护的 0xmason.com 如何处理访问数据。CheckIP 的检测功能另适用其[隐私政策](https://checkip.0xmason.com/privacy)。

## 访问和托管

打开页面和图片时，托管与内容分发服务会接收 IP 地址、请求时间、网址、浏览器信息等网络请求数据，用于提供内容、排查故障与防止滥用。主站使用 Vercel，图片和域名服务使用 Cloudflare，文章数据库使用 Supabase。

相关服务的数据处理说明见 [Vercel](https://vercel.com/legal/privacy-policy)、[Cloudflare](https://www.cloudflare.com/privacypolicy/) 和 [Supabase](https://supabase.com/privacy)。这些服务的日志保留由实际配置与各自政策决定；本站不声称所有访问记录会立即删除。

## Cookie 与本地存储

网站在你的浏览器本地保存浅色、深色或跟随系统的主题选择，键名为 mason-theme。后台登录使用认证 Cookie；普通读者无需注册或登录。你可以在浏览器的网站数据设置中清除这些数据，清除后主题偏好会重置，后台登录也可能失效。

当前主站没有启用 Google Analytics 或 Google AdSense 广告脚本。

## 推荐链接与外部网站

点击推荐链接后，目标服务可能通过链接参数或自己的 Cookie 归因注册与购买，并向推荐人提供奖励记录。目标网站按自己的隐私政策处理数据。本站不会要求读者提交银行卡、护照或账户密码。

## Google 广告与隐私选择

未来启用 Google AdSense 前，我会更新本页及所用广告服务清单，并配置适用的同意管理。启用后，Google 及其他广告供应商可能使用 Cookie，依据你此前访问本站或其他网站的情况提供广告；Google 的广告 Cookie 可让其及合作伙伴展示个性化广告。

你可通过 [Google 广告设置](https://myadcenter.google.com/)管理个性化广告，或了解 [Google 如何使用合作网站的数据](https://business.safety.google/privacy/)。启用广告时，适用地区的访客将获得同意、拒绝或撤回选择的入口；这段说明本身不会启用广告或替代同意管理。

## 联系与数据请求

如对数据处理有疑问，可以通过[联系页面](/contact)联系 Mason，说明相关网址、时间和请求内容。不要发送密码、验证码或完整证件。清除浏览器数据不会同时删除托管商或第三方已有的记录。`,
  },
  terms: {
    title: '使用说明与披露',
    description: '阅读本站实践记录、推荐链接、费用信息、第三方内容与开源代码的使用说明',
    body: `0xmason.com 提供个人实践记录和工具入口。访问和使用第三方产品时，以对应服务商的当前条款与实际页面为准。

## 如何理解文章里的结果

一次扣款、认证或到账记录，只说明当次操作结果。它不保证其他用户得到相同结果，也不保证活动、价格或产品长期不变。账户、税务和付款资料应如实填写，文件应反映真实情况。

涉及账户、加密资产或跨境付款的文章不构成针对个人的投资、税务或法律建议。涉及资金的决定需要你结合自己的情况判断。

## 推荐与广告

推荐链接或邀请码可能给我带来佣金或奖励。文章会说明推荐关系，奖励的条件与到账以服务商核算为准。未来出现的展示广告会与正文和操作入口区分，不要求读者点击广告支持本站。

## 内容和代码许可

网站代码按公开仓库中的 MIT 许可使用。文章、个人头像、品牌标识与第三方图片不随代码一起授权。引用文章请标注作者和原文链接；如需使用图片或大段内容，请先通过[联系页面](/contact)沟通。

## 更正

我会根据可核对的信息修正错误。若发现信息过期、链接失效或权利问题，请提供具体页面与位置。`,
  },
} as const;

export type InformationSlug = keyof typeof informationPages;

export function informationPage(slug: string) {
  return Object.hasOwn(informationPages, slug) ? informationPages[slug as InformationSlug] : undefined;
}
