import { LexerError } from "../errors/lexer-error.js";
import { TokenType } from "./token-type.js";

import type { Token } from "./token.js";

const keywords: Record<string, TokenType> = {
  let: TokenType.Let,
  const: TokenType.Const,
  fn: TokenType.Fn,
  return: TokenType.Return,
  if: TokenType.If,
  else: TokenType.Else,
  while: TokenType.While,
  true: TokenType.True,
  false: TokenType.False,
  null: TokenType.Null,
  print: TokenType.Print,
};

export class Lexer {
  private readonly source: string;

  private tokens: Token[] = [];

  private start = 0;
  private current = 0;

  private line = 1;
  private column = 1;

  private startLine = 1;
  private startColumn = 1;

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.startLine = this.line;
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
      // Delimiters
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

      // Arithmetic
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

      // Assignment / comparison
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

      // Logical operators
      case "&":
        if (this.match("&")) {
          this.addToken(TokenType.And);
          break;
        }

        throw this.error(
          "Unexpected '&'. Did you mean '&&'?",
        );

      case "|":
        if (this.match("|")) {
          this.addToken(TokenType.Or);
          break;
        }

        throw this.error(
          "Unexpected '|'. Did you mean '||'?",
        );

      // Division / comments
      case "/":
        if (this.match("/")) {
          this.skipComment();
        } else {
          this.addToken(TokenType.Slash);
        }
        break;

      // String
      case "\"":
        this.string();
        break;

      // Whitespace
      case " ":
      case "\r":
      case "\t":
        break;

      case "\n":
        this.newLine();
        break;

      default:
        if (this.isDigit(char)) {
          this.number();
          return;
        }

        if (this.isAlpha(char)) {
          this.identifier();
          return;
        }

        throw this.error(
          `Unexpected character '${char}'.`,
        );
    }
  }

  private string(): void {
    while (
      this.peek() !== "\"" &&
      !this.isAtEnd()
    ) {
      if (this.peek() === "\n") {
        this.advance();
        this.newLine();
        continue;
      }

      this.advance();
    }

    if (this.isAtEnd()) {
      throw new LexerError(
        "Unterminated string.",
        this.startLine,
        this.startColumn,
      );
    }

    // Closing quote
    this.advance();

    this.addToken(TokenType.String);
  }

  private number(): void {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    if (
      this.peek() === "." &&
      this.isDigit(this.peekNext())
    ) {
      // Decimal point
      this.advance();

      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    this.addToken(TokenType.Number);
  }

  private identifier(): void {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.slice(
      this.start,
      this.current,
    );

    const type =
      keywords[text] ?? TokenType.Identifier;

    this.addToken(type);
  }

  private skipComment(): void {
    while (
      this.peek() !== "\n" &&
      !this.isAtEnd()
    ) {
      this.advance();
    }
  }

  private advance(): string {
    const char = this.source[this.current]!;

    this.current++;
    this.column++;

    return char;
  }

  private peek(): string {
    if (this.isAtEnd()) {
      return "\0";
    }

    return this.source[this.current]!;
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) {
      return "\0";
    }

    return this.source[this.current + 1]!;
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) {
      return false;
    }

    if (this.source[this.current] !== expected) {
      return false;
    }

    this.current++;
    this.column++;

    return true;
  }

  private addToken(type: TokenType): void {
    const lexeme = this.source.slice(
      this.start,
      this.current,
    );

    this.tokens.push({
      type,
      lexeme,
      line: this.startLine,
      column: this.startColumn,
    });
  }

  private newLine(): void {
    this.line++;
    this.column = 1;
  }

  private isDigit(char: string): boolean {
    return char >= "0" && char <= "9";
  }

  private isAlpha(char: string): boolean {
    return (
      (char >= "a" && char <= "z") ||
      (char >= "A" && char <= "Z") ||
      char === "_"
    );
  }

  private isAlphaNumeric(char: string): boolean {
    return (
      this.isAlpha(char) ||
      this.isDigit(char)
    );
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private error(message: string): LexerError {
    return new LexerError(
      message,
      this.startLine,
      this.startColumn,
    );
  }
}