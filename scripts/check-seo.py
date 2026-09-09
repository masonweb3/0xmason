#!/usr/bin/env python3
"""Crawl rendered HTML and the live sitemap using only Python's standard library."""

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from pathlib import Path
import sys
from urllib.error import HTTPError
from urllib.parse import unquote, urljoin, urlsplit, urlunsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler
import xml.etree.ElementTree as ET


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def read(url, method="GET"):
    request = Request(url, method=method, headers={"User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)"})
    try:
        response = build_opener(NoRedirect).open(request, timeout=45)
    except HTTPError as error:
        response = error
    with response:
        return response.status, {key.lower(): value for key, value in response.headers.items()}, response.read().decode("utf-8", errors="replace")


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.meta, self.links, self.images, self.schemas, self.times = {}, [], [], [], []
        self.canonicals, self.titles, self.headings, self.ids, self.icons = [], [], [], [], []
        self.language, self.capture, self.text = "", "", ""
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag == "html":
            self.language = attrs.get("lang", "")
        if tag == "meta":
            key = attrs.get("name", attrs.get("property", "")).lower()
            self.meta.setdefault(key, []).append(attrs.get("content", ""))
        if tag == "link":
            if attrs.get("rel") == "canonical":
                self.canonicals.append(attrs.get("href", ""))
            if attrs.get("rel") in ("icon", "apple-touch-icon"):
                self.icons.append(attrs.get("href", ""))
        if tag == "a" and attrs.get("href"):
            self.links.append(attrs)
        if tag == "img":
            self.images.append(attrs)
        if tag == "time":
            self.times.append(attrs.get("datetime"))
        if tag in ("title", "h1") or (tag == "script" and attrs.get("type") == "application/ld+json"):
            self.capture, self.text = tag, ""

    def handle_data(self, data):
        if self.capture:
            self.text += data

    def handle_endtag(self, tag):
        if tag != self.capture:
            return
        if tag == "title":
            self.titles.append(self.text.strip())
        elif tag == "h1":
            self.headings.append(self.text.strip())
        elif tag == "script":
            value = json.loads(self.text)
            self.schemas.extend(value.get("@graph", [value]) if isinstance(value, dict) else value)
        self.capture, self.text = "", ""

    def one(self, key):
        values = self.meta.get(key, [])
        assert len(values) == 1 and values[0].strip(), f"Missing or duplicate {key}"
        return values[0]


def clean(url):
    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc, parts.path or "/", "", ""))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("origin", nargs="?", default="https://0xmason.com")
    parser.add_argument("--noindex", action="store_true", help="Verify an isolated local or preview build")
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    base = args.origin.rstrip("/")
    assert urlsplit(base).scheme in ("http", "https") and not urlsplit(base).username, "Use an HTTP(S) origin"
    canonical_base = "https://0xmason.com"
    failures, checked, pages, assets = [], [], {}, set()

    def require(condition, label):
        if not condition:
            failures.append(label)

    def robots_noindex(headers):
        return "noindex" in headers.get("x-robots-tag", "").lower()

    status, _, robots = read(base + "/robots.txt")
    require(status == 200, "robots.txt must return 200")
    if args.noindex:
        require("Disallow: /\n" in robots, "Non-production robots must disallow crawling")
    else:
        require(f"Sitemap: {canonical_base}/sitemap.xml" in robots, "robots sitemap reference")
        require("Disallow: /\n" not in robots, "Production robots blocks the whole site")
        for path in ("/admin", "/api", "/preview"):
            require(f"Disallow: {path}" in robots, f"robots boundary {path}")

    status, headers, xml = read(base + "/sitemap.xml")
    require(status == 200 and "xml" in headers.get("content-type", ""), "Sitemap status and XML content type")
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9", "image": "http://www.google.com/schemas/sitemap-image/1.1"}
    root = ET.fromstring(xml)
    require(root.tag == f"{{{ns['s']}}}urlset", "Sitemap namespace")
    entries = root.findall("s:url", ns)
    sitemap = {entry.findtext("s:loc", namespaces=ns): entry for entry in entries}
    require(len(sitemap) == len(entries), "Duplicate sitemap URLs")
    require(len(entries) <= 100, "Audit crawl limit is 100 pages; raise it explicitly when the site grows")
    require(not sitemap if args.noindex else bool(sitemap), "Sitemap indexing mode")
    for url, entry in sitemap.items():
        require(url is not None and clean(url) == url and url.startswith(canonical_base + "/"), f"Invalid sitemap URL: {url}")
        path = urlsplit(url).path
        require(not path.startswith(("/admin", "/api", "/preview")), f"Private sitemap URL: {path}")
        lastmod = entry.findtext("s:lastmod", namespaces=ns)
        if lastmod:
            require(datetime.fromisoformat(lastmod.replace("Z", "+00:00")) <= datetime.now(timezone.utc), f"Future lastmod: {path}")
        for image in entry.findall("image:image/image:loc", ns):
            assets.add(image.text)

    queue = ["/", "/resources"] + [urlsplit(url).path for url in sitemap]
    indexable = set()
    while queue:
        path = queue.pop(0)
        if path in pages:
            continue
        if len(pages) >= 100:
            failures.append("Internal crawl exceeded 100 pages")
            break
        status, headers, html = read(base + path)
        require(status == 200, f"{path}: linked page returns {status}")
        page = Page(html)
        pages[path] = page
        require(page.language == "zh-CN", f"{path}: document language")
        require(len(page.titles) == 1 and bool(page.titles[0]), f"{path}: unique, nonempty title")
        require(len(page.headings) == 1 and bool(page.headings[0]), f"{path}: one rendered H1")
        require(len(page.ids) == len(set(page.ids)), f"{path}: duplicate anchor IDs")
        require(len(page.canonicals) == 1 and clean(page.canonicals[0]) == clean(canonical_base + path), f"{path}: canonical target")
        try:
            page.one("description")
            require("width=device-width" in page.one("viewport"), f"{path}: mobile viewport")
            noindex = "noindex" in page.one("robots")
            if args.noindex:
                require(noindex and robots_noindex(headers), f"{path}: non-production noindex metadata and header")
            elif not noindex:
                indexable.add(canonical_base + path)
                require(not robots_noindex(headers) and "noindex" not in page.one("googlebot"), f"{path}: conflicting index directives")
            for key in ("og:title", "og:description", "og:image", "twitter:title", "twitter:description", "twitter:image"):
                page.one(key)
            require(page.one("twitter:card") == "summary_large_image", f"{path}: social card")
            require(clean(page.one("og:url")) == clean(canonical_base + path), f"{path}: OG canonical alignment")
            assets.update(page.meta["og:image"] + page.meta["twitter:image"])
        except AssertionError as error:
            failures.append(f"{path}: {error}")
        for image in page.images:
            require("alt" in image, f"{path}: image missing alt attribute")
            assets.add(image.get("src", ""))
        assets.update(page.icons)
        for link in page.links:
            destination = urlsplit(urljoin(base + path, link["href"]))
            if destination.scheme not in ("http", "https") or destination.netloc != urlsplit(base).netloc:
                continue
            target = destination.path or "/"
            if target.startswith(("/admin", "/api", "/preview", "/_next")) or "." in target.rsplit("/", 1)[-1]:
                continue
            queue.append(target)
        schemas = {schema.get("@type"): schema for schema in page.schemas}
        if path == "/":
            require({"WebSite", "Person"}.issubset(schemas), "Homepage site and author structured data")
        else:
            crumbs = schemas.get("BreadcrumbList", {}).get("itemListElement", [])
            require(bool(crumbs), f"{path}: breadcrumb structured data")
            for position, item in enumerate(crumbs, 1):
                require(item.get("position") == position and bool(item.get("name")) and item.get("item", "").startswith(canonical_base), f"{path}: breadcrumb item {position}")
        if path.count("/") == 3 and path.startswith("/resources/"):
            article = schemas.get("BlogPosting", {})
            require(bool(article) and article.get("headline") == page.headings[0], f"{path}: article headline matches visible content")
            require(article.get("author", {}).get("name") == "Mason" and bool(article.get("author", {}).get("url")), f"{path}: article author")
            modified = article.get("dateModified")
            require(bool(modified) and modified in page.times, f"{path}: visible article update date")
            require(page.meta.get("article:modified_time") == [modified], f"{path}: article date agrees with OG")
            require(bool(article.get("image")), f"{path}: article image")
            if not args.noindex and canonical_base + path in sitemap:
                entry = sitemap[canonical_base + path]
                require(entry.findtext("s:lastmod", namespaces=ns) == modified, f"{path}: lastmod agrees with article")
                require(bool(entry.findall("image:image", ns)), f"{path}: sitemap article images")
        checked.append({"path": path, "status": status, "title": page.titles[0] if page.titles else ""})

    titles = [page.titles[0] for page in pages.values() if page.titles]
    descriptions = [page.meta["description"][0] for page in pages.values() if page.meta.get("description")]
    require(len(titles) == len(set(titles)), "Duplicate titles across pages")
    require(len(descriptions) == len(set(descriptions)), "Duplicate descriptions across pages")
    if not args.noindex:
        require(indexable == set(sitemap), f"Sitemap and crawlable indexable pages differ: {indexable.symmetric_difference(sitemap)}")
    for path, page in pages.items():
        for link in page.links:
            destination = urlsplit(urljoin(base + path, link["href"]))
            if destination.netloc == urlsplit(base).netloc and destination.fragment and destination.path in pages:
                require(unquote(destination.fragment) in pages[destination.path].ids, f"{path}: missing anchor {destination.fragment}")
    for path in ("/admin", "/api/articles", "/preview/0"):
        _, headers, _ = read(base + path)
        require(robots_noindex(headers), f"{path}: missing noindex response header")
    for path in ("/seo-missing-page", "/resources/seo-missing-category", "/resources/global-accounts/seo-missing-article"):
        status, _, html = read(base + path)
        require(status == 404 and "noindex" in html, f"{path}: real 404 with noindex, received {status}")
    for url in assets:
        require(urlsplit(url).netloc == "cdn.0xmason.com" and urlsplit(url).scheme == "https", "Image outside HTTPS CDN")
        require(urlsplit(url).path.endswith((".webp", ".ico", ".png")), "Unexpected image format")
    if not args.noindex:
        def asset_status(url):
            status, headers, _ = read(url, "HEAD")
            return url, status, headers
        with ThreadPoolExecutor(max_workers=4) as pool:
            for url, status, headers in pool.map(asset_status, sorted(assets)):
                require(status == 200 and headers.get("content-type", "").startswith("image/"), f"Unavailable image: {url}")
                require(not robots_noindex(headers), f"Image blocks indexing: {url}")
        for source, target in (("/resources/ai-subscriptions", "/resources/global-accounts"), ("/resources/ai-subscriptions/bybit-eu", "/resources/global-accounts/bybit-eu")):
            status, headers, _ = read(base + source)
            require(status in (301, 308) and urljoin(base, headers.get("location", "")) == base + target, f"Permanent legacy redirect: {source}")
        for origin in ("http://0xmason.com", "https://www.0xmason.com"):
            status, headers, _ = read(origin + "/resources?seo-check=1")
            require(status in (301, 308) and headers.get("location") == canonical_base + "/resources?seo-check=1", f"HTTPS/domain redirect preserves path and query: {origin}")

    report = {"checkedAt": datetime.now(timezone.utc).isoformat(), "origin": base, "mode": "noindex" if args.noindex else "production", "pages": checked, "sitemapURLs": len(sitemap), "images": len(assets), "failures": failures}
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    for item in checked:
        print(f"CHECK {item['path']}")
    for failure in failures:
        print(f"FAIL {failure}", file=sys.stderr)
    print(f"SEO: {len(pages)} pages, {len(sitemap)} sitemap URLs, {len(assets)} images, {len(failures)} failures")
    return bool(failures)


if __name__ == "__main__":
    sys.exit(main())
