import "extensions/Guild";
import "extensions/VoiceChannel";

import { PlayerManager } from "./PlayerManager";
import { LavalinkNode } from "./node/Node";
import { Player } from "./player/Player";
import { JoinOptions, Link } from "./player/Link";
import { REST } from "./node/REST";

export * from "./node/REST";
export * from "./node/Node";
export * from "./player/Player";
export * from "./player/Track";
export * from "./player/Link";
export * from "./PlayerManager";

export default {
  PlayerManager,
  LavalinkNode,
  Player,
  Link,
  REST
};

declare module "@kyudiscord/neo" {
  interface Client {
    readonly voice: PlayerManager;
  }

  interface VoiceChannel {
    /**
     * The player for this voice channel.
     */
    player: Player | null;

    /**
     * Joins this voice channel.
     * @param options Options for self mute and self deaf.
     * @since  @kyudiscord/voice 1.0.3
     */
    join(options?: JoinOptions): Promise<Player>;

    /**
     * Leaves this voice channel.
     * @since @kyudiscord/voice 1.0.3
     */
    leave(): Promise<this>;
  }

  interface Guild {
    /**
     * The voice channel link for this guild.
     * @since @kyudiscord/voice 1.0.3
     */
    link: Link | null;
  }
}
