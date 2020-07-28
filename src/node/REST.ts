import { URL } from "url";
import * as https from "https";
import * as http from "http";

import type { IncomingMessage } from "http";
import type { LavalinkNode } from "./Node";
import type { LoadTracksResponse, TrackInfo } from "@lavaclient/types";

export class REST {
  /**
   * The lavalink node this rest manager belongs to.
   */
  public readonly node: LavalinkNode;

  /**
   * @param node
   */
  public constructor(node: LavalinkNode) {
    this.node = node;
  }

  /**
   * Load tracks from lavaplayer.
   * @param identifier The identifier.
   * @since 1.0.0
   */
  public loadTracks(identifier: string): Promise<LoadTracksResponse> {
    return this._make(`/loadtracks?identifier=${identifier}`);
  }

  /**
   * Decodes a single base64 track.
   * @param track The base64 track to decode.
   * @since 1.0.0
   */
  public decodeTracks(track: string): Promise<TrackInfo>;
  /**
   * Decodes multiple base64 tracks.
   * @param tracks The base64 tracks to decode.
   * @since 1.0.0
   */
  public decodeTracks(tracks: string[]): Promise<TrackInfo[]>;
  public decodeTracks(tracks: string | string[]): Promise<TrackInfo[] | TrackInfo> {
    if (Array.isArray(tracks)) {
      return this._make("/decodetracks", {
        data: JSON.stringify({ tracks }),
        method: "post"
      })
    } else {
      return this._make(`/decodetrack?track=${tracks}`);
    }
  }

  /**
   * @param endpoint The endpoint.
   * @param options The method to use, or any data to write.
   * @private
   */
  private _make<T>(endpoint: string, { data, method = "get" }: { data?: any, method?: string } = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.node.https ? "https" : "http"}://${this.node.address}${endpoint}`);
      const options = {
        method,
        headers: { authorization: this.node.password }
      }

      const callback = (res: IncomingMessage) => {
        let chunk = Buffer.alloc(0);

        res.on("error", (err) => {
          reject(err)
        });

        res.on("data", (data) => {
          chunk = Buffer.concat([ chunk, data ])
        });

        res.on("end", () => {
          resolve(res.statusCode === 204 ? null : JSON.parse(chunk.toString()));
        });
      }

      let req: http.ClientRequest;
      if (this.node.https) req = https.request(url, options, callback);
      else req = http.request(url, options, callback);

      req.on("error", (e) => reject(e))
      if (data) req.write(data);
      req.end();
    });
  }
}