import { TournamentsLayout } from "@/components/tournaments/TournamentsLayout";
import { MyGamesPanel } from "@/components/tournaments/MyGamesPanel";

const MyGamesPage = () => (
  <TournamentsLayout title="My Games" subtitle="Your joined, created, and reported matches.">
    <MyGamesPanel />
  </TournamentsLayout>
);

export default MyGamesPage;
