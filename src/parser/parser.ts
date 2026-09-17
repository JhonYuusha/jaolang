import { ParserError } from "../errors/parser-error.js";
import { TokenType } from "../lexer/token-type.js";

import type { Token } from "../lexer/token.js";
import type {
  AssignmentExpression,
  BinaryExpression,
  BlockStatement,
  BooleanLiteral,
  CallExpression,
  Expression,
  ExpressionStatement,
  FunctionDeclaration,
  Identifier,
  IfStatement,
  NullLiteral,
  NumberLiteral,
  Program,
  ReturnStatement,
  SourceLocation,
  Statement,
  StringLiteral,
  UnaryExpression,
  VariableDeclaration,
  WhileStatement,
} from "./ast.js";

export class Parser {
  private current = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): Program {
    const body: Statement[] = [];

    while (!this.isAtEnd()) {
      body.push(this.declaration());
    }

    return {
      type: "Program",
      body,
    };
  }

  private declaration(): Statement {
    if (this.match(TokenType.Let)) {
      return this.variableDeclaration("let");
    }

    if (this.match(TokenType.Const)) {
      return this.variableDeclaration("const");
    }

    if (this.match(TokenType.Fn)) {
      return this.functionDeclaration();
    }

    return this.statement();
  }

  private variableDeclaration(
    kind: "let" | "const",
  ): VariableDeclaration {
    const declarationToken = this.previous();

    const nameToken = this.consume(
      TokenType.Identifier,
      `Expected variable name after '${kind}'.`,
    );

    this.consume(
      TokenType.Equal,
      `Expected '=' after variable name '${nameToken.lexeme}'.`,
    );

    if (
      this.check(TokenType.Semicolon) ||
      this.check(TokenType.EOF) ||
      this.check(TokenType.RightBrace)
    ) {
      throw this.error(
        this.peek(),
        "Expected expression after '='.",
      );
    }

    const initializer = this.expression();

    this.optionalSemicolon();

    return {
      type: "VariableDeclaration",
      kind,
      name: this.identifierFromToken(nameToken),
      initializer,
      location: this.location(declarationToken),
    };
  }

  private functionDeclaration(): FunctionDeclaration {
    const functionToken = this.previous();

    const nameToken = this.consume(
      TokenType.Identifier,
      "Expected function name after 'fn'.",
    );

    this.consume(
      TokenType.LeftParen,
      `Expected '(' after function name '${nameToken.lexeme}'.`,
    );

    const parameters: Identifier[] = [];

    if (!this.check(TokenType.RightParen)) {
      do {
        const parameter = this.consume(
          TokenType.Identifier,
          "Expected parameter name.",
        );

        parameters.push(
          this.identifierFromToken(parameter),
        );
      } while (this.match(TokenType.Comma));
    }

    this.consume(
      TokenType.RightParen,
      "Expected ')' after function parameters.",
    );

    this.consume(
      TokenType.LeftBrace,
      "Expected '{' before function body.",
    );

    const body = this.blockStatement(
      this.previous(),
    );

    return {
      type: "FunctionDeclaration",
      name: this.identifierFromToken(nameToken),
      parameters,
      body,
      location: this.location(functionToken),
    };
  }

  private statement(): Statement {
    if (this.match(TokenType.Return)) {
      return this.returnStatement();
    }

    if (this.match(TokenType.If)) {
      return this.ifStatement();
    }

    if (this.match(TokenType.While)) {
      return this.whileStatement();
    }

    if (this.match(TokenType.LeftBrace)) {
      return this.blockStatement(
        this.previous(),
      );
    }

    return this.expressionStatement();
  }

  private returnStatement(): ReturnStatement {
    const returnToken = this.previous();

    let value: Expression | null = null;

    if (
      !this.check(TokenType.Semicolon) &&
      !this.check(TokenType.RightBrace) &&
      !this.check(TokenType.EOF)
    ) {
      value = this.expression();
    }

    this.optionalSemicolon();

    return {
      type: "ReturnStatement",
      value,
      location: this.location(returnToken),
    };
  }

  private ifStatement(): IfStatement {
    const ifToken = this.previous();

    this.consume(
      TokenType.LeftParen,
      "Expected '(' after 'if'.",
    );

    const condition = this.expression();

    this.consume(
      TokenType.RightParen,
      "Expected ')' after if condition.",
    );

    this.consume(
      TokenType.LeftBrace,
      "Expected '{' before if body.",
    );

    const consequent = this.blockStatement(
      this.previous(),
    );

    let alternate:
      | BlockStatement
      | IfStatement
      | null = null;

    if (this.match(TokenType.Else)) {
      if (this.match(TokenType.If)) {
        alternate = this.ifStatement();
      } else {
        this.consume(
          TokenType.LeftBrace,
          "Expected '{' after 'else'.",
        );

        alternate = this.blockStatement(
          this.previous(),
        );
      }
    }

    return {
      type: "IfStatement",
      condition,
      consequent,
      alternate,
      location: this.location(ifToken),
    };
  }

  private whileStatement(): WhileStatement {
    const whileToken = this.previous();

    this.consume(
      TokenType.LeftParen,
      "Expected '(' after 'while'.",
    );

    const condition = this.expression();

    this.consume(
      TokenType.RightParen,
      "Expected ')' after while condition.",
    );

    this.consume(
      TokenType.LeftBrace,
      "Expected '{' before while body.",
    );

    const body = this.blockStatement(
      this.previous(),
    );

    return {
      type: "WhileStatement",
      condition,
      body,
      location: this.location(whileToken),
    };
  }

  private blockStatement(
    openingBrace: Token,
  ): BlockStatement {
    const body: Statement[] = [];

    while (
      !this.check(TokenType.RightBrace) &&
      !this.isAtEnd()
    ) {
      body.push(this.declaration());
    }

    this.consume(
      TokenType.RightBrace,
      "Expected '}' after block.",
    );

    return {
      type: "BlockStatement",
      body,
      location: this.location(openingBrace),
    };
  }

  private expressionStatement(): ExpressionStatement {
    const startToken = this.peek();

    const expression = this.expression();

    this.optionalSemicolon();

    return {
      type: "ExpressionStatement",
      expression,
      location: this.location(startToken),
    };
  }

  private expression(): Expression {
    return this.assignment();
  }

  private assignment(): Expression {
    const expression = this.logicalOr();

    if (this.match(TokenType.Equal)) {
      const equalsToken = this.previous();

      const value = this.assignment();

      if (expression.type !== "Identifier") {
        throw this.error(
          equalsToken,
          "Invalid assignment target.",
        );
      }

      const assignment: AssignmentExpression = {
        type: "AssignmentExpression",
        target: expression,
        value,
        location: expression.location,
      };

      return assignment;
    }

    return expression;
  }

  private logicalOr(): Expression {
    let expression = this.logicalAnd();

    while (this.match(TokenType.Or)) {
      const operator = this.previous();
      const right = this.logicalAnd();

      expression = this.binaryExpression(
        expression,
        operator,
        right,
      );
    }

    return expression;
  }

  private logicalAnd(): Expression {
    let expression = this.equality();

    while (this.match(TokenType.And)) {
      const operator = this.previous();
      const right = this.equality();

      expression = this.binaryExpression(
        expression,
        operator,
        right,
      );
    }

    return expression;
  }

  private equality(): Expression {
    let expression = this.comparison();

    while (
      this.match(
        TokenType.EqualEqual,
        TokenType.BangEqual,
      )
    ) {
      const operator = this.previous();
      const right = this.comparison();

      expression = this.binaryExpression(
        expression,
        operator,
        right,
      );
    }

    return expression;
  }

  private comparison(): Expression {
    let expression = this.term();

    while (
      this.match(
        TokenType.Greater,
        TokenType.GreaterEqual,
        TokenType.Less,
        TokenType.LessEqual,
      )
    ) {
      const operator = this.previous();
      const right = this.term();

      expression = this.binaryExpression(
        expression,
        operator,
        right,
      );
    }

    return expression;
  }

  private term(): Expression {
    let expression = this.factor();

    while (
      this.match(
        TokenType.Plus,
        TokenType.Minus,
      )
    ) {
      const operator = this.previous();
      const right = this.factor();

      expression = this.binaryExpression(
        expression,
        operator,
        right,
      );
    }

    return expression;
  }

  private factor(): Expression {
    let expression = this.unary();

    while (
      this.match(
        TokenType.Star,
        TokenType.Slash,
        TokenType.Percent,
      )
    ) {
      const operator = this.previous();
      const right = this.unary();

      expression = this.binaryExpression(
        expression,
        operator,
        right,
      );
    }

    return expression;
  }

  private unary(): Expression {
    if (
      this.match(
        TokenType.Bang,
        TokenType.Minus,
      )
    ) {
      const operator = this.previous();
      const operand = this.unary();

      const expression: UnaryExpression = {
        type: "UnaryExpression",
        operator:
          operator.type === TokenType.Bang
            ? "!"
            : "-",
        operand,
        location: this.location(operator),
      };

      return expression;
    }

    return this.call();
  }

  private call(): Expression {
    let expression = this.primary();

    while (this.match(TokenType.LeftParen)) {
      expression = this.finishCall(expression);
    }

    return expression;
  }

  private finishCall(
    calleeExpression: Expression,
  ): CallExpression {
    const openingParen = this.previous();

    if (calleeExpression.type !== "Identifier") {
      throw this.error(
        openingParen,
        "Only identifiers can be called.",
      );
    }

    const args: Expression[] = [];

    if (!this.check(TokenType.RightParen)) {
      do {
        args.push(this.expression());
      } while (this.match(TokenType.Comma));
    }

    this.consume(
      TokenType.RightParen,
      "Expected ')' after function arguments.",
    );

    return {
      type: "CallExpression",
      callee: calleeExpression,
      arguments: args,
      location: calleeExpression.location,
    };
  }

  private primary(): Expression {
    if (this.match(TokenType.False)) {
      const token = this.previous();

      const literal: BooleanLiteral = {
        type: "BooleanLiteral",
        value: false,
        location: this.location(token),
      };

      return literal;
    }

    if (this.match(TokenType.True)) {
      const token = this.previous();

      const literal: BooleanLiteral = {
        type: "BooleanLiteral",
        value: true,
        location: this.location(token),
      };

      return literal;
    }

    if (this.match(TokenType.Null)) {
      const token = this.previous();

      const literal: NullLiteral = {
        type: "NullLiteral",
        value: null,
        location: this.location(token),
      };

      return literal;
    }

    if (this.match(TokenType.Number)) {
      const token = this.previous();

      const literal: NumberLiteral = {
        type: "NumberLiteral",
        value: Number(token.lexeme),
        location: this.location(token),
      };

      return literal;
    }

    if (this.match(TokenType.String)) {
      const token = this.previous();

      const literal: StringLiteral = {
        type: "StringLiteral",
        value: token.lexeme.slice(1, -1),
        location: this.location(token),
      };

      return literal;
    }

    if (
      this.match(
        TokenType.Identifier,
        TokenType.Print,
      )
    ) {
      return this.identifierFromToken(
        this.previous(),
      );
    }

    if (this.match(TokenType.LeftParen)) {
      const expression = this.expression();

      this.consume(
        TokenType.RightParen,
        "Expected ')' after expression.",
      );

      return expression;
    }

    throw this.error(
      this.peek(),
      `Expected expression, found '${this.peek().lexeme || "EOF"}'.`,
    );
  }

  private binaryExpression(
    left: Expression,
    operator: Token,
    right: Expression,
  ): BinaryExpression {
    const validOperators = new Map<
      TokenType,
      BinaryExpression["operator"]
    >([
      [TokenType.Plus, "+"],
      [TokenType.Minus, "-"],
      [TokenType.Star, "*"],
      [TokenType.Slash, "/"],
      [TokenType.Percent, "%"],
      [TokenType.EqualEqual, "=="],
      [TokenType.BangEqual, "!="],
      [TokenType.Greater, ">"],
      [TokenType.GreaterEqual, ">="],
      [TokenType.Less, "<"],
      [TokenType.LessEqual, "<="],
      [TokenType.And, "&&"],
      [TokenType.Or, "||"],
    ]);

    const mappedOperator =
      validOperators.get(operator.type);

    if (!mappedOperator) {
      throw this.error(
        operator,
        `Unsupported binary operator '${operator.lexeme}'.`,
      );
    }

    return {
      type: "BinaryExpression",
      operator: mappedOperator,
      left,
      right,
      location: left.location,
    };
  }

  private identifierFromToken(
    token: Token,
  ): Identifier {
    return {
      type: "Identifier",
      name: token.lexeme,
      location: this.location(token),
    };
  }

  private optionalSemicolon(): void {
    this.match(TokenType.Semicolon);
  }

  private match(
    ...types: TokenType[]
  ): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private consume(
    type: TokenType,
    message: string,
  ): Token {
    if (this.check(type)) {
      return this.advance();
    }

    throw this.error(
      this.peek(),
      message,
    );
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) {
      return type === TokenType.EOF;
    }

    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }

    return this.previous();
  }

  private isAtEnd(): boolean {
    return (
      this.peek().type === TokenType.EOF
    );
  }

  private peek(): Token {
    return this.tokens[this.current]!;
  }

  private previous(): Token {
    return this.tokens[this.current - 1]!;
  }

  private location(
    token: Token,
  ): SourceLocation {
    return {
      line: token.line,
      column: token.column,
    };
  }

  private error(
    token: Token,
    message: string,
  ): ParserError {
    return new ParserError(
      message,
      token.line,
      token.column,
    );
  }
}