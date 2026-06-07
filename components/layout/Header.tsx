import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-[#ded7ca] bg-[#fbfaf7]/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-mono text-sm font-semibold uppercase tracking-[0.18em]">
          ShipCheck
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-[#4f473d]">
          <Link href="/about" className="hover:text-ink">
            About
          </Link>
          <Link href="/check" className="border border-ink px-3 py-2 text-ink hover:bg-ink hover:text-white">
            Check your product
          </Link>
        </nav>
      </div>
    </header>
  );
}
