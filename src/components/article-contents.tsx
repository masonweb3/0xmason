"use client";

import { useEffect, useState } from "react";

// Marks the section being read: the last heading that has scrolled past the sticky header.
export function ArticleContents({ headings }: { headings: { id: string; title: string }[] }) {
  const [active, setActive] = useState<string>();
  useEffect(() => {
    const targets = headings.map((heading) => document.getElementById(heading.id)).filter((element): element is HTMLElement => !!element);
    let frame = 0;
    const update = () => {
      frame = 0;
      setActive(targets.filter((element) => element.getBoundingClientRect().top < 120).pop()?.id);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [headings]);
  return (
    <ol>
      {headings.map((heading, index) => (
        <li key={`${heading.id}-${index}`}>
          <a href={`#${heading.id}`} aria-current={active === heading.id ? "location" : undefined}>{heading.title}</a>
        </li>
      ))}
    </ol>
  );
}
