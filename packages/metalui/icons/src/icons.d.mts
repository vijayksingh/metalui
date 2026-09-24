export interface IconSource {
  name: string;
  cat: 'Tools' | 'Actions' | 'Status';
  label: string;
  hover: string;
  press: string;
  defs?: string;
  body: string;
  base?: string;
  mo?: string;
  shape?: string;
}
export declare const ICONS: IconSource[];
