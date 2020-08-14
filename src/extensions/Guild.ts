import { neo } from "@kyudiscord/neo";

import type { Link } from "../player/Link";

neo.extend("Guild", (Guild) =>
  class extends Guild {
    /**
     * The voice channel link for this guild.
     * @since @kyudiscord/voice 1.0.3
     */
    public get link(): Link | null {
      const player = this.client.voice.players.get(this.id);
      if (!player) return null;
      return player.link;
    }
  }
);
