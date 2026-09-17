import { describe, expect, it } from "vitest";

import { LexerError } from "../../src/errors/lexer-error.js";
import { Lexer } from "../../src/lexer/lexer.js";
import { TokenType } from "../../src/lexer/token-type.js";

function tokenTypes(source: string): TokenType[] {
  return new Lexer(source)
    .tokenize()
    .map((token) => token.type);
}

describe("Lexer", () => {
  it("tokenizes variable declarations", () => {
    const tokens = new Lexer(
      'let name = "Joao"',
    ).tokenize();

    expect(tokens).toEqual([
      {
        type: TokenType.Let,
        lexeme: "let",
        line: 1,
        column: 1,
      },
      {
        type: TokenType.Identifier,
        lexeme: "name",
        line: 1,
        column: 5,
      },
      {
        type: TokenType.Equal,
        lexeme: "=",
        line: 1,
        column: 10,
      },
      {
        type: TokenType.String,
        lexeme: '"Joao"',
        line: 1,
        column: 12,
      },
      {
        type: TokenType.EOF,
        lexeme: "",
        line: 1,
        column: 18,
      },
    ]);
  });

  it("tokenizes keywords", () => {
    expect(
      tokenTypes(
        "let const fn return if else while true false null print",
      ),
    ).toEqual([
      TokenType.Let,
      TokenType.Const,
      TokenType.Fn,
      TokenType.Return,
      TokenType.If,
      TokenType.Else,
      TokenType.While,
      TokenType.True,
      TokenType.False,
      TokenType.Null,
      TokenType.Print,
      TokenType.EOF,
    ]);
  });

  it("distinguishes keywords from identifiers", () => {
    const tokens = new Lexer(
      "let leticia = 18",
    ).tokenize();

    expect(tokens[0]?.type).toBe(TokenType.Let);
    expect(tokens[1]?.type).toBe(
      TokenType.Identifier,
    );

    expect(tokens[1]?.lexeme).toBe("leticia");
  });

  it("tokenizes integer and decimal numbers", () => {
    const tokens = new Lexer(
      "10 20.5 999.99",
    ).tokenize();

    expect(
      tokens
        .filter(
          (token) =>
            token.type === TokenType.Number,
        )
        .map((token) => token.lexeme),
    ).toEqual([
      "10",
      "20.5",
      "999.99",
    ]);
  });

  it("tokenizes arithmetic operators", () => {
    expect(
      tokenTypes("+ - * / %"),
    ).toEqual([
      TokenType.Plus,
      TokenType.Minus,
      TokenType.Star,
      TokenType.Slash,
      TokenType.Percent,
      TokenType.EOF,
    ]);
  });

  it("tokenizes comparison operators", () => {
    expect(
      tokenTypes(
        "= == ! != > >= < <=",
      ),
    ).toEqual([
      TokenType.Equal,
      TokenType.EqualEqual,
      TokenType.Bang,
      TokenType.BangEqual,
      TokenType.Greater,
      TokenType.GreaterEqual,
      TokenType.Less,
      TokenType.LessEqual,
      TokenType.EOF,
    ]);
  });

  it("tokenizes logical operators", () => {
    expect(
      tokenTypes("&& ||"),
    ).toEqual([
      TokenType.And,
      TokenType.Or,
      TokenType.EOF,
    ]);
  });

  it("ignores comments", () => {
    const tokens = new Lexer(`
      // This is ignored
      let age = 18
    `).tokenize();

    expect(
      tokens.map((token) => token.type),
    ).toEqual([
      TokenType.Let,
      TokenType.Identifier,
      TokenType.Equal,
      TokenType.Number,
      TokenType.EOF,
    ]);
  });

  it("tracks line and column positions", () => {
    const tokens = new Lexer(
      "let age = 18\nprint(age)",
    ).tokenize();

    const printToken = tokens.find(
      (token) =>
        token.type === TokenType.Print,
    );

    expect(printToken).toMatchObject({
      line: 2,
      column: 1,
    });
  });

  it("throws on unexpected characters", () => {
    expect(
      () => new Lexer("let age = @").tokenize(),
    ).toThrow(LexerError);

    expect(
      () => new Lexer("let age = @").tokenize(),
    ).toThrow(
      "Unexpected character '@'.",
    );
  });

  it("throws on unterminated strings", () => {
    expect(
      () =>
        new Lexer(
          'let name = "Joao',
        ).tokenize(),
    ).toThrow(LexerError);

    expect(
      () =>
        new Lexer(
          'let name = "Joao',
        ).tokenize(),
    ).toThrow("Unterminated string.");
  });

  it("rejects incomplete logical operators", () => {
    expect(
      () => new Lexer("true & false").tokenize(),
    ).toThrow(
      "Unexpected '&'. Did you mean '&&'?",
    );

    expect(
      () => new Lexer("true | false").tokenize(),
    ).toThrow(
      "Unexpected '|'. Did you mean '||'?",
    );
  });
});