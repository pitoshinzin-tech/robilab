export function ShareButton({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener" className="inline-block rounded-full bg-[var(--rl-cyan)] px-6 py-3 font-bold text-[#0a0c16]">
      X でシェア
    </a>
  );
}
