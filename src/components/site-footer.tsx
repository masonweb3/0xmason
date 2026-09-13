export function SiteFooter() {
  return (
    <footer className="site-footer container">
      <p className="affiliate-disclosure">部分链接含 aff，我可能获得佣金</p>
      <div className="footer-meta">
        <div className="footer-links">
          <span>0xmason.com</span>
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
