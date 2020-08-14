import { EventEmitter } from "events";

import type { Track } from "@lavaclient/types";
import type { AudioTrack } from "./Track";
import type { Link } from "./Link";
import type { LavalinkNode } from "../node/Node";
import type { PlayerManager } from "../PlayerManager";

export class Player extends EventEmitter {
  /**
   * The guild link of this player.
   */
  public readonly link: Link;

  /**
   * The current playing track.
   */
  public track: AudioTrack | null;

  /**
   * Whether or not this player is paused.
   */
  public paused: boolean;

  /**
   * Whether or not this player is playing.
   */
  public playing: boolean;

  /**
   * The volume of this player.
   */
  public volume: number;

  /**
   * The current equalizer config for this player.
   */
  public equalizer: Band[];

  /**
   * @param link
   */
  public constructor(link: Link) {
    super();

    this.link = link;
    this.track = null;
    this.paused = false;
    this.playing = false;
    this.volume = 100;
    this.equalizer = [];
  }

  /**
   * The lavalink node that manages this player.
   */
  public get node(): LavalinkNode {
    return this.link.node;
  }

  /**
   * The player manager instance.
   */
  public get manager(): PlayerManager {
    return this.node.manager;
  }

  /**
   * Play a track.
   * @param track The track to play.
   * @param options Options to pass to lavalink.
   * @since 1.0.0
   */
  public async play(track: string | Track, options: PlayOptions = {}): Promise<Player> {
    await this.link.send("play", {
      track: typeof track === "object" ? track.track : track,
      ...options
    });

    return this;
  }

  /**
   * Set the paused state of this player: true for paused; false for not paused;
   * @param state
   * @since 1.0.0
   */
  public async pause(state = true): Promise<Player> {
    await this.link.send("pause", {
      pause: this.paused = state
    });

    return this;
  }

  /**
   * Sets the pause state of this player to `false`.
   * @since 1.0.0
   */
  public async resume(): Promise<Player> {
    return this.pause(false);
  }

  /**
   * Stops the current playing track.
   * @since 1.0.0
   */
  public async stop(): Promise<Player> {
    await this.link.send("stop");
    return this;
  }

  /**
   * Set the volume of this player.
   * @param value Number between 0 and 1000, defaults to `100`.
   */
  public async setVolume(value = 100): Promise<Player> {
    await this.link.send("volume", {
      volume: this.volume = value
    });

    return this;
  }

  /**
   * Seek to a position in the current playing track.
   * @param pos Position in milliseconds.
   */
  public async seek(pos: number): Promise<Player> {
    await this.link.send("seek", {
      position: pos
    });

    return this;
  }

  /**
   * Set the equalizer of the player.
   * @param bands The bands of the equalizer.
   * @param merge Whether to merge the existing equalizer bands with the provided.
   * @since 1.0.0
   */
  public async setEqualizer(bands: Array<number | Band>, merge = false): Promise<this> {
    const _bands = bands
      .filter(b => typeof b !== "undefined" && (b !== null && b !== void 0))
      .map((b, i) => typeof b === "number"
        ? { band: i, gain: b }
        : b);

    this.equalizer = merge
      ? this.equalizer.concat(_bands)
      : _bands;

    await this.link.send("equalizer", { bands: this.equalizer });

    return this;
  }

  /**
   * Destroys this player.
   * @since 1.0.0
   */
  public async destroy(): Promise<Player> {
    await this.link.send("destroy");
    return this;
  }
}

export interface Band {
  band: number;
  gain: number;
}

export interface PlayOptions {
  startTime?: number;
  endTime?: number;
  noReplace?: boolean;
}
