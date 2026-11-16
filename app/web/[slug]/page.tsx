import { ViewTransition } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { webNote, webProjects } from "@/content";
import { TLink } from "@/components/shell/TLink";
import { AutoVideo } from "@/components/worlds/web/AutoVideo";
import s from "@/components/worlds/web/web.module.css";

export function generateStaticParams() {
  return webProjects.map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/web/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = webProjects.find((x) => x.slug === slug);
  return p ? { title: `${p.name} · Web Showcase · Pavlo Havras`, description: p.line, openGraph: { images: [p.image] } } : {};
}

export default async function WebProjectPage({ params }: PageProps<"/web/[slug]">) {
  const { slug } = await params;
  const i = webProjects.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const p = webProjects[i];
  const next = webProjects[(i + 1) % webProjects.length];

  return (
    <article className={s.detail} aria-labelledby="drop-h">
      <div className={s.detailTop}>
        <TLink href="/web/" className={s.back}>← All drops</TLink>
        <p className={s.kicker}>Drop {String(i + 1).padStart(2, "0")} / {String(webProjects.length).padStart(2, "0")}</p>
      </div>
      <ViewTransition name={`web-${p.slug}`} share="morph" default="none">
        <h1 id="drop-h" className={s.detailName}>{p.name}</h1>
      </ViewTransition>
      <div className={s.detailGrid}>
        <div>
          <p className="text-xl leading-relaxed">{p.line}</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {p.tags.map((t) => <li key={t} className="border border-line px-3 py-1 font-mono text-xs uppercase tracking-[0.12em]">{t}</li>)}
          </ul>
          <a href={p.href} target="_blank" rel="noopener noreferrer" className={s.visit}>Open live site <span aria-hidden="true">↗</span></a>
          <p className="mt-6 font-mono text-xs text-muted">{webNote}</p>
        </div>
        <figure className={s.frame}>
          <AutoVideo src={p.video} poster={p.image} label={`Screen recording of ${p.name}`} />
        </figure>
      </div>
      <TLink href={`/web/${next.slug}/`} className={s.next}>
        <small>Next drop →</small>
        <b>{next.name}</b>
      </TLink>
    </article>
  );
}
