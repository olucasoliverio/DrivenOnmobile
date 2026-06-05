import React from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

type Token = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  strike?: boolean;
};
type FormatKey = 'bold' | 'italic' | 'strike';

function parseInline(text: string): Token[] {
  const tokens: Token[] = [];
  let current = '';
  const stack: string[] = [];
  const markers: Record<string, FormatKey> = {
    '*': 'bold',
    '_': 'italic',
    '~': 'strike',
  };

  const flush = () => {
    if (!current) return;
    const token: Token = { text: current };
    stack.forEach((marker) => {
      const key = markers[marker];
      if (key) token[key] = true;
    });
    tokens.push(token);
    current = '';
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (markers[char]) {
      const nextSame = text.indexOf(char, i + 1);
      if (nextSame > i + 1) {
        flush();
        const activeIndex = stack.lastIndexOf(char);
        if (activeIndex >= 0) stack.splice(activeIndex, 1);
        else stack.push(char);
        continue;
      }
    }
    current += char;
  }
  flush();
  return tokens.length ? tokens : [{ text }];
}

export default function WhatsAppMessagePreview({
  message,
  textStyle,
}: {
  message: string;
  textStyle?: StyleProp<TextStyle>;
}) {
  const lines = message.split('\n');

  return (
    <Text style={textStyle}>
      {lines.map((line, lineIndex) => (
        <React.Fragment key={`${lineIndex}-${line}`}>
          {parseInline(line).map((token, tokenIndex) => (
            <Text
              key={`${lineIndex}-${tokenIndex}`}
              style={[
                token.bold && { fontWeight: '800' },
                token.italic && { fontStyle: 'italic' },
                token.strike && { textDecorationLine: 'line-through' },
              ]}
            >
              {token.text}
            </Text>
          ))}
          {lineIndex < lines.length - 1 ? '\n' : null}
        </React.Fragment>
      ))}
    </Text>
  );
}
