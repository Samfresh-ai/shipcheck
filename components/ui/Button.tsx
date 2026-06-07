import Link from "next/link";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

const base =
  "inline-flex items-center justify-center border text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary: "border-ink bg-ink px-5 py-3 text-white hover:bg-brand-900",
  secondary: "border-ink bg-transparent px-5 py-3 text-ink hover:bg-brand-50",
  ghost: "border-transparent px-3 py-2 text-ink hover:bg-black/5",
};

type Variant = keyof typeof variants;

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  variant = "primary",
  className = "",
}: PropsWithChildren<{ href: string; variant?: Variant; className?: string }>) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}
