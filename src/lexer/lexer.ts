import { TokenType } from "./token-type.js";
import type { Token } from "./token.js";

export class Lexer {
  private readonly source: string;

  private tokens: Token[] = [];

  private start = 0;
  private current = 0;

  private line = 1;
  private column = 1;
  private startColumn = 1;

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.startColumn = this.column;

      this.scanToken();
    }

    this.tokens.push({
      type: TokenType.EOF,
      lexeme: "",
      line: this.line,
      column: this.column,
    });

    return this.tokens;
  }

  private scanToken(): void {
  const char = this.advance();

  switch (char) {
    case "(":
      this.addToken(TokenType.LeftParen);
      break;

    case ")":
      this.addToken(TokenType.RightParen);
      break;

    case "{":
      this.addToken(TokenType.LeftBrace);
      break;

    case "}":
      this.addToken(TokenType.RightBrace);
      break;

    case ",":
      this.addToken(TokenType.Comma);
      break;

    case ";":
      this.addToken(TokenType.Semicolon);
      break;

    case "+":
      this.addToken(TokenType.Plus);
      break;

    case "-":
      this.addToken(TokenType.Minus);
      break;

    case "*":
      this.addToken(TokenType.Star);
      break;

    case "%":
      this.addToken(TokenType.Percent);
      break;

    case "=":
      this.addToken(
        this.match("=")
          ? TokenType.EqualEqual
          : TokenType.Equal,
      );
      break;

    case "!":
      this.addToken(
        this.match("=")
          ? TokenType.BangEqual
          : TokenType.Bang,
      );
      break;

    case ">":
      this.addToken(
        this.match("=")
          ? TokenType.GreaterEqual
          : TokenType.Greater,
      );
      break;

    case "<":
      this.addToken(
        this.match("=")
          ? TokenType.LessEqual
          : TokenType.Less,
      );
      break;

    case "&":
      if (this.match("&")) {
        this.addToken(TokenType.And);
      }
      break;

    case "|":
      if (this.match("|")) {
        this.addToken(TokenType.Or);
      }
      break;
  }
}

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private advance(): string {
  const char = this.source[this.current]!;
  this.current++;
  this.column++;

  return char;
}

private peek(): string {
  if (this.isAtEnd()) return "\0";

  return this.source[this.current]!;
}

private peekNext(): string {
  if (this.current + 1 >= this.source.length) return "\0";

  return this.source[this.current + 1]!;
}

private match(expected: string): boolean {
  if (this.isAtEnd()) return false;
  if (this.source[this.current] !== expected) return false;

  this.current++;
  this.column++;

  return true;
}

private addToken(type: TokenType): void {
  const lexeme = this.source.slice(this.start, this.current);

  this.tokens.push({
    type,
    lexeme,
    line: this.line,
    column: this.startColumn,
  });
}}