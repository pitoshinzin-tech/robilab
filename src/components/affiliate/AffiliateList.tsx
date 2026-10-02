import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { affiliatesFor } from "@/data/affiliates";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

export function AffiliateList({ typeCode }: { typeCode: string }) {
  const items = affiliatesFor(typeCode);
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="pr-heading" className="grid gap-4">
      <SectionHeading id="pr-heading" title="このタイプのあなたに" action={<Badge variant="pr">PR</Badge>} />
      <ul className="grid gap-3">
        {items.map((a) => (
          <Card as="li" key={a.id} className="grid gap-1">
            <a href={a.url} target="_blank" rel="sponsored noopener" className="inline-flex min-h-11 items-center gap-1 justify-self-start text-base font-bold text-rl-accent underline-offset-4 hover:underline">
              {a.name}<ExternalLink aria-hidden className="size-4" />
            </a>
            <p className="text-sm text-rl-muted">{a.comment}</p>
          </Card>
        ))}
      </ul>
      <p className="text-sm text-rl-muted">このリンクから買うと、ロビラボに紹介料が入ることがあります(<Link href="/disclosure" className="text-rl-accent underline">広告表記</Link>)。</p>
    </section>
  );
}
