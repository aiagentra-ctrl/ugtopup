import type { DBTournament } from "@/lib/tournamentsApi";
import { TournamentCard } from "./TournamentCard";

interface Props {
  items: DBTournament[];
  joinedIds: Set<string>;
  currentUserId?: string;
  onOpen: (t: DBTournament) => void;
  onJoin: (t: DBTournament) => void;
  joiningId: string | null;
}

export const FeaturedCarousel = ({ items, joinedIds, currentUserId, onOpen, onJoin, joiningId }: Props) => {
  if (items.length === 0) return null;
  return (
    <div className="-mx-3 px-3 sm:-mx-4 sm:px-4">
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 scrollbar-hide">
        {items.map((t) => (
          <div key={t.id} className="w-[300px] shrink-0 snap-start sm:w-[340px]">
            <TournamentCard
              t={t}
              joined={joinedIds.has(t.id)}
              isCreator={currentUserId === t.created_by}
              onOpen={() => onOpen(t)}
              onJoin={() => onJoin(t)}
              joining={joiningId === t.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
