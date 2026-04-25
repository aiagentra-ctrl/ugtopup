import { useGamePageDescription } from "@/hooks/useGamePageDescription";

interface GamePageDescriptionProps {
  slug: string;
}

/**
 * Renders the admin-managed description for a game/product page.
 * Hidden when no description has been set, so existing pages stay clean.
 */
export const GamePageDescription = ({ slug }: GamePageDescriptionProps) => {
  const { description, loading } = useGamePageDescription(slug);

  if (loading || !description || !description.description.trim()) return null;

  return (
    <section className="container mx-auto px-2 sm:px-4 mt-3">
      <div className="rounded-xl border border-border bg-card/60 p-4 sm:p-5">
        {description.title && (
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">
            {description.title}
          </h2>
        )}
        <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
          {description.description}
        </p>
      </div>
    </section>
  );
};
