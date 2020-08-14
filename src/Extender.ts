import { Extender } from "@kyudiscord/neo";
import { LavalinkNode } from "./node/Node";
import { AudioTrack } from "./player/Track";
import { Link } from "./player/Link";
import { Player } from "./player/Player";

const structures = {
  Player,
  Link,
  LavalinkNode,
  AudioTrack
};

export const voice = new Extender<any, typeof structures>(structures);
