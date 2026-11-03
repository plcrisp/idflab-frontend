import { HelpTextToken } from '../../../../core/models/contextual-help.model';

const GLOSSARY_REGEX = /\[\[(.*?)\]\]/g;

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

  const tokens: HelpTextToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = GLOSSARY_REGEX.exec(text)) !== null) {
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
    const definition = glossary ? glossary[termKey] : undefined;

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
