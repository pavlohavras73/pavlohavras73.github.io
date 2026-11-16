"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { usePageTransition } from "./TransitionProvider";

type Props = ComponentProps<typeof Link> & { href: string };

/**
 * Internal link with the page transition. External links and same-page hashes behave natively.
 * Modifier-clicks (new tab) are never intercepted.
 */
export function TLink({ href, onClick, ...rest }: Props) {
  const { navigate } = usePageTransition();
  const pathname = usePathname();

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const [path] = href.split("#");
    const norm = (p: string) => (p.endsWith("/") ? p : p + "/");
    if (!path || norm(path) === norm(pathname)) return; // same page: let the hash scroll
    e.preventDefault();
    navigate(href);
  };

  return <Link href={href} onClick={handle} {...rest} />;
}
