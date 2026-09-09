import Link from "next/link";
import { ArrowUpRight, XLogo } from "@phosphor-icons/react/dist/ssr";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="site-header container">
      <Link href="/" className="wordmark" aria-label="Mason 首页">
        Mason<span className="brand-dot">.</span>
      </Link>
      <nav aria-label="主导航" className="main-nav">
        <Link className="nav-resource" href="/resources">精选资源</Link>
        <a
          href="https://x.com/mason0x_"
          target="_blank"
          rel="noopener noreferrer"
          className="social-link"
          aria-label="在 X 上查看 Mason（新标签页）"
        >
          <XLogo size={19} aria-hidden="true" />
          <ArrowUpRight size={20} aria-hidden="true" />
        </a>
        <ThemeToggle />
      </nav>
    </header>
  );
}
