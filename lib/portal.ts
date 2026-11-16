import type { WorldId } from "@/content";

/**
 * Shared view-transition names: a Hangar door morphs into its world's hero.
 * Every world hero must use these names on its outer section and its h1.
 */
export const portalName = (id: Exclude<WorldId, "hangar">) => ({
  frame: `portal-${id}`,
  title: `portal-title-${id}`,
});
