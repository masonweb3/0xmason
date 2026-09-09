import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export const metadata = { title: "页面未找到", robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <main id="main-content" className="container not-found-page">
      <p className="eyebrow">404</p>
      <h1>这页还没写到。</h1>
      <p>链接可能已经变了，回首页看看。</p>
      <Link href="/" className="primary-button"><ArrowLeft size={22} aria-hidden="true" />返回首页</Link>
    </main>
  );
}
