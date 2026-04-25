import { useEffect, useState } from "react";
import { fetchGamePageDescription, type GamePageDescription } from "@/lib/gamePageContentApi";

export const useGamePageDescription = (slug: string) => {
  const [data, setData] = useState<GamePageDescription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchGamePageDescription(slug)
      .then((d) => active && setData(d))
      .catch(() => active && setData(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  return { description: data, loading };
};
