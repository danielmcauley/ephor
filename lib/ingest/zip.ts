import { strFromU8, unzipSync } from "fflate";

export function unzipTextEntries(buffer: Buffer | Uint8Array) {
  const archive = unzipSync(
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  );

  return new Map(
    Object.entries(archive).map(([name, bytes]) => [name, strFromU8(bytes)])
  );
}
