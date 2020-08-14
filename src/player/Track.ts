import type { Track, TrackInfo } from "@lavaclient/types";

export class AudioTrack implements Track {
  /**
   * The track string of this audio track.
   */
  public readonly track: string;

  /**
   * The track info of this audio track.
   */
  public readonly info: TrackInfo;

  /**
   * The current position of this track.
   */
  public position: number;

  /**
   * The timestamp in which this track started playing.
   */
  public timestamp: number;

  /**
   * @param track The lavaplayer track.
   */
  public constructor(track: Track) {
    this.track = track.track;
    this.info = track.info;
    this.position = 0;
    this.timestamp = 0;
  }

  /**
   * The amount of time this song has left (in milliseconds).
   * @since 1.0.0
   */
  public get remaining(): number {
    return this.info.length - this.position;
  }

  /**
   * Defines the toString behavior of this audio track.
   * @since 1.0.0
   */
  public toString(): string {
    return this.info.title;
  }
}
