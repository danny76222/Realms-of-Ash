import { createFileRoute } from "@tanstack/react-router";
import { GameProvider, useGame } from "@/game/store";
import { useEffect } from "react";
import { useSettings } from "@/game/settings";
import { setMood } from "@/game/music";
import { worldTone } from "@/game/tone";
import { TitleScreen } from "@/components/game/TitleScreen";
import { CreateHero } from "@/components/game/CreateHero";
import { WorldMap } from "@/components/game/WorldMap";
import { LocationScreen } from "@/components/game/LocationScreen";
import { BattleScreen } from "@/components/game/BattleScreen";
import { StoryScreen } from "@/components/game/StoryScreen";
import { EndingScreen } from "@/components/game/EndingScreen";
import { TopBar } from "@/components/game/TopBar";
import { LoreScreen } from "@/components/game/LoreScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Realm of Ash — Turn-Based Medieval RPG" },
      {
        name: "description",
        content:
          "Realm of Ash is a pixel-art turn-based RPG: six warring houses, a branching campaign against a usurper, party combat, dungeons and multiple endings.",
      },
      { property: "og:title", content: "Realm of Ash — Turn-Based Medieval RPG" },
      {
        property: "og:description",
        content:
          "Raise a company, pick a side in a fracturing realm, fight turn-based battles and decide how the war ends.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Screens() {
  const { screen, game } = useGame();
  useSettings();
  const tone = game ? worldTone(game) : null;
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("world-war", tone?.mood === "war");
    root.classList.toggle("world-peace", tone?.mood === "peace");
    return () => root.classList.remove("world-war", "world-peace");
  }, [tone?.mood]);
  useEffect(() => {
    setMood(screen === "battle" ? "battle" : screen === "map" || screen === "location" ? "travel" : "quiet");
  }, [screen]);
  if (screen === "create") return <CreateHero />;
  if (screen === "lore" && !game) return <LoreScreen />;
  if (!game || screen === "title") return <TitleScreen />;
  return (
    <div className="torchlit min-h-screen px-2 py-2">
      <TopBar />
      <div key={screen} className="screen-fade">
        {screen === "map" ? <WorldMap /> : null}
        {screen === "battle" ? <BattleScreen /> : null}
        {screen === "story" ? <StoryScreen /> : null}
        {screen === "ending" ? <EndingScreen /> : null}
        {screen === "location" ? <LocationScreen /> : null}
        {screen === "lore" ? <LoreScreen /> : null}
      </div>
    </div>
  );
}

function Page() {
  return (
    <GameProvider>
      <main>
        <h1 className="sr-only">Realm of Ash — a turn-based medieval RPG</h1>
        <Screens />
      </main>
    </GameProvider>
  );
}
