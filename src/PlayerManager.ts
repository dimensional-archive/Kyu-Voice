import { GatewayOP, Guild, Store, Util } from "@kyudiscord/neo";
import { EventEmitter } from "events";
import { voice } from "./Extender";
import { LavalinkNode } from "./node/Node";

import type { Client, Payload } from "@kyudiscord/neo";
import type { NodeData } from "./node/Node";
import type { Player } from "./player/Player";

const defaults: ManagerOptions = {
  nodes: [],
  resuming: {
    key: Math.random().toString(32),
    timeout: 60000
  },
  reconnect: {
    auto: true,
    delay: 15000,
    maxTries: 5
  }
};

export class PlayerManager extends EventEmitter {
  /**
   * The client instance.
   */
  public readonly client: Client;

  /**
   * All connected lavalink nodes.
   */
  public readonly nodes: Store<string, LavalinkNode>

  /**
   * Options for lavalink resuming.
   */
  public resuming: ResumeOptions | null;

  /**
   * Options to use when reconnecting.
   */
  public reconnection: ReconnectOptions;

  /**
   * @param client
   * @param options
   */
  constructor(client: Client, options: ManagerOptions = {}) {
    super();

    options = Util.mergeDefault(defaults, options);

    this.client = client;
    this.nodes = new Store();
    Object.defineProperty(client, "voice", { value: this });

    this.reconnection = options.reconnect as ReconnectOptions;
    this.resuming = (typeof options.resuming === "boolean"
      ? !options.resuming ? null : defaults.resuming
      : options.resuming ?? defaults.resuming) as ResumeOptions;

    this._listen(options);
  }

  /**
   * Ideal nodes to use.
   */
  public get idealNodes(): LavalinkNode[] {
    return [ ...this.nodes.values() ].sort((a, b) => a.penalties - b.penalties);
  }

  /**
   * All connected players.
   */
  public get players(): Store<string, Player> {
    return this.nodes.reduce((p, n) => {
      for (const [ id, player ] of n.players) p.set(id, player);
      return p;
    }, new Store());
  }

  /**
   * Creates a new player.
   * @param guild The guild that the player is for.
   * @param node The node to use.
   */
  public create(guild: string | Guild, node?: string | LavalinkNode): Player | undefined {
    node = node ?? this.idealNodes[0];

    if (node && node instanceof LavalinkNode) {
      return node.createPlayer(guild);
    }

    return undefined;
  }

  /**
   * Creates a new player.
   * @param guild The guild that the player is for.
   */
  public async destroy(guild: string | Guild): Promise<void> {
    const player = this.players.get(String(guild));
    if (player) return player.node.destroyPlayer(guild);
    return;
  }

  /**
   * Listens for the ready and raw client event.
   * @param options
   * @private
   */
  private _listen(options: ManagerOptions) {
    this.client
      .once("ready", () => {
        for (const node of options.nodes ?? []) {
          const created = new (voice.get("LavalinkNode"))(this, node);
          created.connect();
          this.nodes.set(node.id, created);
        }
      })
      .on("raw", async (pk: Payload) => {
        if (pk.op !== GatewayOP.DISPATCH) return;

        const player = this.players.get(pk.d.guild_id);
        if (player) {
          switch (pk.t) {
            case "VOICE_STATE_UPDATE":
              await this._stateUpdate(pk.d);
              break;
            case "VOICE_SERVER_UPDATE":
              await this._serverUpdate(pk.d);
              break;
          }
        }

        return;
      });
  }

  /**
   * Called when the client receives a voice server update from the gateway.
   * @param update The voice server update
   * @private
   */
  private async _serverUpdate(update: VoiceServerUpdate): Promise<void> {
    const player = this.players.get(update.guild_id);
    if (player) {
      player.link.provide(update);
      await player.link.voiceUpdate();
    }

    return;
  }

  /**
   * Called when the client receives a voice state update from the gateway.
   * @param d The voice state update.
   * @private
   */
  private async _stateUpdate(d: VoiceStateUpdate): Promise<void> {
    const player = this.players.get(d.guild_id);
    if (player && d.user_id === this.client.user?.id) {
      if (d.channel_id !== player.link.channelId) {
        player.emit("move", d.channel_id);
        player.link.channelId = d.channel_id;
      }

      player.link.provide(d);
      await player.link.voiceUpdate();
    }
  }
}

export interface ManagerOptions {
  nodes?: NodeData[];
  resuming?: ResumeOptions | boolean;
  reconnect?: ReconnectOptions;
}

export interface ReconnectOptions {
  maxTries?: number;
  auto?: boolean;
  delay?: number;
}

export interface ResumeOptions {
  timeout?: number;
  key?: string;
}

export interface VoiceStateUpdate {
  guild_id: string;
  channel_id?: string;
  user_id: string;
  session_id: string;
  deaf?: boolean;
  mute?: boolean;
  self_deaf?: boolean;
  self_mute?: boolean;
  suppress?: boolean;
}

export interface VoiceServerUpdate {
  guild_id: string;
  token: string;
  endpoint: string;
}
