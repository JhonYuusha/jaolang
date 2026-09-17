export enum TokenType {
  // Literals
  Identifier = "IDENTIFIER",
  Number = "NUMBER",
  String = "STRING",

  // Keywords
  Let = "LET",
  Const = "CONST",
  Fn = "FN",
  Return = "RETURN",
  If = "IF",
  Else = "ELSE",
  While = "WHILE",
  True = "TRUE",
  False = "FALSE",
  Null = "NULL",

  // Built-ins
  Print = "PRINT",

  // Arithmetic operators
  Plus = "PLUS",
  Minus = "MINUS",
  Star = "STAR",
  Slash = "SLASH",
  Percent = "PERCENT",

  // Assignment / comparison
  Equal = "EQUAL",
  EqualEqual = "EQUAL_EQUAL",
  Bang = "BANG",
  BangEqual = "BANG_EQUAL",
  Greater = "GREATER",
  GreaterEqual = "GREATER_EQUAL",
  Less = "LESS",
  LessEqual = "LESS_EQUAL",

  // Logical operators
  And = "AND",
  Or = "OR",

  // Delimiters
  LeftParen = "LEFT_PAREN",
  RightParen = "RIGHT_PAREN",
  LeftBrace = "LEFT_BRACE",
  RightBrace = "RIGHT_BRACE",
  Comma = "COMMA",
  Semicolon = "SEMICOLON",

  // Special
  EOF = "EOF",
}