import { neo } from "@kyudiscord/neo";

import type { JoinOptions } from "../player/Link";
import type { Player } from "../player/Player";

neo.extend("VoiceChannel", (VoiceChannel) =>
  class extends VoiceChannel {
    /**
     * The player for this voice channel.
     */
    public player: Player | null = null;

    /**
     * Joins this voice channel.
     * @param options Options for self mute and self deaf.
     * @since  @kyudiscord/voice 1.0.3
     */
    public join(options: JoinOptions = {}): Player {
      if (this.joinable) {
        const player = this.client.voice.create(this.guild.id);
        if (player) {
          player.link.connect(this, options);
          return this.player = player;
        }

        throw new Error("No Node Available");
      }

      throw new Error("This voice channel is not joinable.");
    }

    /**
     * Leaves this voice channel.
     * @since @kyudiscord/voice 1.0.3
     */
    public async leave(): Promise<this> {
      if (this.guild.link) await this.client.voice.destroy(this.guild.id);
      return this;
    }
  }
);
