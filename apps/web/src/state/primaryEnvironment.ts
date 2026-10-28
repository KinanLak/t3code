import type { EnvironmentId } from "@t3tools/contracts";
import { Atom } from "effect/reactivity";

import { environmentCatalog } from "../connection/catalog";
import { readDesktopHomeEnvironmentId } from "../localEnvironment";

export const primaryEnvironmentIdAtom = Atom.make((get) => {
  for (const [environmentId, entry] of get(environmentCatalog.catalogValueAtom).entries) {
    if (entry.target._tag === "PrimaryConnectionTarget") {
      return environmentId;
    }
  }
  return null;
}).pipe(Atom.withLabel("web-primary-environment-id"));

// With Local environment off, a background service can still own the desktop's
// T3 home. It runs on this machine just as the desktop's own backend would.
export const desktopHomeEnvironmentIdAtom = Atom.make(readDesktopHomeEnvironmentId).pipe(
  Atom.keepAlive,
  Atom.withLabel("web-desktop-home-environment-id"),
);

// WSL-only mode gives the primary its own home, so both can run here at once.
export const localMachineEnvironmentIdAtom = Atom.family((environmentId: EnvironmentId) =>
  Atom.make((get) => {
    const primaryEnvironmentId = get(primaryEnvironmentIdAtom);
    const desktopHomeEnvironmentId = get(desktopHomeEnvironmentIdAtom);
    if (environmentId === primaryEnvironmentId || environmentId === desktopHomeEnvironmentId) {
      return environmentId;
    }
    return primaryEnvironmentId ?? desktopHomeEnvironmentId;
  }).pipe(Atom.withLabel(`web-local-machine-environment-id:${environmentId}`)),
);
