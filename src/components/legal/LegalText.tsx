export function LegalText({ text }: { text: string }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6 leading-relaxed">
      {text.split(/\n{2,}/).map((block, i) => {
        if (block.startsWith("# ")) {
          return (
            <h1 key={i} className="mb-4 text-2xl font-bold">
              {block.replace(/^#\s*/, "")}
            </h1>
          );
        }
        if (block.startsWith("## ")) {
          return (
            <h2 key={i} className="mb-3 mt-6 text-lg font-bold">
              {block.replace(/^##\s*/, "")}
            </h2>
          );
        }
        return (
          <p key={i} className="mb-3 whitespace-pre-wrap text-sm">
            {block}
          </p>
        );
      })}
    </main>
  );
}
