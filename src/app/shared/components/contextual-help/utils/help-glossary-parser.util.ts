import { HelpTextToken } from '../../../../core/models/contextual-help.model';

/**
 * Parses a string containing glossary markers like `[[TERM]]`
 * and converts it into structured tokens for rendering.
 */
export function parseGlossaryTokens(
  text: string | null | undefined,
  glossary?: Record<string, string> | null,
): HelpTextToken[] {
  if (!text) {
    return [];
  }

  const regex = /\[\[(.*?)\]\]/g;
  const tokens: HelpTextToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = match.index + match[0].length;

    // Push preceding plain text
    if (matchStart > lastIndex) {
      tokens.push({
        type: 'text',
        value: text.substring(lastIndex, matchStart),
      });
    }

    const termKey = match[1].trim();
    let definition = glossary ? glossary[termKey] : undefined;
    if (!definition && glossary) {
      const lower = termKey.toLowerCase();
      const foundKey = Object.keys(glossary).find((k) => k.toLowerCase() === lower);
      if (foundKey) {
        definition = glossary[foundKey];
      }
    }

    if (definition) {
      tokens.push({
        type: 'glossary',
        term: termKey,
        definition,
      });
    } else {
      // Degrade gracefully to regular text if definition is missing
      tokens.push({
        type: 'text',
        value: termKey,
      });
    }

    lastIndex = matchEnd;
  }

  // Push remaining plain text
  if (lastIndex < text.length) {
    tokens.push({
      type: 'text',
      value: text.substring(lastIndex),
    });
  }

  return tokens;
}
