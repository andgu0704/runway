import { indexContent, type ContentPack } from '../engine';
import { contentData } from '.';
import { validateContent } from './validate';

let cached: ContentPack | null = null;

/** The validated content pack. Throws with a readable report if content is broken. */
export function loadContent(): ContentPack {
  if (cached !== null) return cached;
  const report = validateContent(contentData);
  if (!report.ok) throw new Error(`Content failed validation:\n${report.errors.join('\n')}`);
  cached = indexContent(contentData);
  return cached;
}
