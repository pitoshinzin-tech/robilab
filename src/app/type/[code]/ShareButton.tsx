export function ShareButton({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener" className="inline-block rounded-full bg-[var(--rl-accent)] px-6 py-3 font-bold text-[var(--rl-on-accent)]">
      X でシェア
    </a>
  );
}
