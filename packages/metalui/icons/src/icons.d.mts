export interface IconFrame { at: number; transform?: string; opacity?: number; draw?: number; easing?: string }
export interface IconTrack { part: string; origin: string; frames: IconFrame[] }
/** One act, played once through on hover, focus or click (docs/ICON-MOTION.md). */
export interface IconStudy { duration: number; caption: string; stages: [string, string, string]; tracks: IconTrack[] }
export interface IconSource {
  name: string;
  cat: 'Tools' | 'Actions' | 'Status';
  label: string;
  /** Legacy hover pose and press descriptions; an icon with a study describes itself by its caption. */
  hover: string;
  press: string;
  defs?: string;
  body: string;
  base?: string;
  /** Legacy CSS motion; ignored when the icon has a study. */
  mo?: string;
  study?: IconStudy;
  shape?: string;
}
export declare const ICONS: IconSource[];
