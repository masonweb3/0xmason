import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="site-footer container">
      <p className="affiliate-disclosure">部分链接含 aff，我可能获得佣金</p>
      <div className="footer-meta">
        <div className="footer-links">
          <span>0xmason.com</span>
          <Link href="/about">关于</Link>
          <Link href="/contact">联系</Link>
          <Link href="/privacy">隐私政策</Link>
          <Link href="/terms">使用说明</Link>
          <a
            href="https://checkip.0xmason.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="CheckIP 网络检测（新标签页）"
          >
            CheckIP 网络检测
          </a>
        </div>
        <span>© 2026 Mason</span>
      </div>
    </footer>
  );
}
