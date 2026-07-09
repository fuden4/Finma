import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-finema-surface/20 mt-auto">
      <div className="max-w-[1920px] mx-auto px-4 md:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-finema-muted">
          <span className="text-finema-accent font-semibold">F</span>
          <span className="text-finema-text font-semibold">inema</span>
          <span className="mx-2 opacity-40">·</span>
          <span>Stream movies with cinematic quality</span>
        </p>
        <Link
          href="/who-we-are"
          className="text-sm text-finema-muted hover:text-finema-accent transition-colors"
        >
          Who We Are
        </Link>
      </div>
    </footer>
  );
}
