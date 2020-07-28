import type { Client, Guild } from "@kyudiscord/neo";
import { GatewayOP, VoiceChannel } from "@kyudiscord/neo";

import type { LavalinkNode } from "../node/Node";
import { Player } from "./Player";
import type { VoiceServerUpdate, VoiceStateUpdate } from "../PlayerManager";
import type { Event, PlayerUpdate } from "@lavaclient/types";
import { AudioTrack } from "./Track";

export class Link {
  /**
   * The guild this link is for.
   */
  public readonly guildId: string;

  /**
   * The guild player.
   */
  public readonly player: Player;

  /**
   * The lavalink node that this link uses.
   */
  public node: LavalinkNode;

  /**
   * The voice channel that this link is for.
   */
  public channelId?: string;

  /**
   * The voice server.
   */
  private _server?: VoiceServerUpdate;

  /**
   * The voice state.
   */
  private _state?: VoiceStateUpdate

  /**
   * @param node
   * @param guildId
   */
  public constructor(node: LavalinkNode, guildId: string) {
    this.node = node;
    this.guildId = guildId;
    this.player = new Player(this);
  }

  /**
   * The neo client.
   */
  public get client(): Client {
    return this.node.manager.client;
  }

  /**
   * The guild this link is for.
   */
  public get guild(): Guild {
    return this.client.guilds.get(this.guildId)!
  }

  /**
   * Connects to a voice channel.
   * @param channel The channel to connect to.
   * @param deaf Whether to self deafen the client.
   * @param mute Whether to self mute the client.
   * @since 1.0.0
   */
  public connect(channel: string | VoiceChannel | null, { deaf, mute }: JoinOptions = {}): Link {
    this.channelId = String(channel);

    this.guild.shard.send({
      op: GatewayOP.VOICE_STATE_UPDATE,
      d: {
        guild_id: this.guildId,
        channel_id: this.channelId,
        self_deaf: deaf ?? false,
        self_mute: mute ?? false
      }
    });

    return this;
  }

  /**
   * Disconnects from the current voice channel if any.
   * @since 1.0.0
   */
  public disconnect(): Link {
    return this.connect(null);
  }

  /**
   * Moves to a different lavalink node.
   * @param node The lavalink node to move to.
   * @since 1.0.0
   */
  public async move(node: LavalinkNode): Promise<Link> {
    this.node.players.delete(this.guildId);
    this.node = node;
    this.node.players.set(this.guildId, this.player);

    await this.player.destroy();
    if (this.channelId) this.connect(this.channelId);

    return this;
  }

  /**
   * Send a payload to the lavalink node.
   * @param op The code for this operation.
   * @param data The data for this operation.
   * @param priority If this operation should be prioritized.
   * @since 1.0.0
   */
  public async send(op: string, data: Dictionary = {}, priority: boolean = false): Promise<Link> {
    await this.node.send({
      op,
      guildId: this.guildId,
      ...data
    }, priority);

    return this;
  }

  /**
   * Provide a voice update from discord.
   * @param update
   * @since 1.0.0
   */
  public provide(update: VoiceStateUpdate | VoiceServerUpdate): Link {
    if ("token" in update) this._server = update;
    else this._state = update;
    return this;
  }

  /**
   /**
   * Send a voice update operation.
   * @since 1.0.0
   */
  public async voiceUpdate(): Promise<Link> {
    if (this._server && this._state) {
      await this.send("voiceUpdate", {
        sessionId: this._state.session_id,
        event: this._server,
      }, true);

      delete this._state;
      delete this._server;
    }

    return this;
  }

  /**
   * @private
   */
  async _handle(event: Event | PlayerUpdate) {
    if (event.op === "event") {
      switch (event.type) {
        case "TrackEndEvent":
          if (event.reason !== "REPLACED") this.player.playing = false;
          delete this.player.track;
          this.player.emit("end", event);
          break;
        case "TrackExceptionEvent":
          this.player.emit("error", event);
          break;
        case "TrackStartEvent":
          this.player.playing = true;
          const info = await this.node.rest.decodeTracks(event.track);
          this.player.track = new AudioTrack({ track: event.track, info });
          this.player.emit("start", this.player.track);
          break;
        case "TrackStuckEvent":
          this.player
            .stop()
            .then(() => this.player.emit("stuck", event));
          break;
        case "WebSocketClosedEvent":
          this.player.emit("wsClosed", event);
          break;
      }
    } else if (event.op === "playerUpdate") {
      if (!event.state || !this.player.track) return;
      this.player.track!.position = event.state.position;
      this.player.track!.timestamp = event.state.time;
    }
  }
}

export interface JoinOptions {
  deaf?: boolean;
  mute?: boolean;
}
