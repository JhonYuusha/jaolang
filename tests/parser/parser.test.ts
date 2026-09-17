import { describe, expect, it } from "vitest";

import { ParserError } from "../../src/errors/parser-error.js";
import { Lexer } from "../../src/lexer/lexer.js";
import { Parser } from "../../src/parser/parser.js";

import type { Program } from "../../src/parser/ast.js";

function parse(source: string): Program {
  const tokens = new Lexer(source).tokenize();

  return new Parser(tokens).parse();
}

describe("Parser", () => {
  it("parses variable declarations", () => {
    const program = parse(`
      let age = 18
      const name = "Joao"
    `);

    expect(program.body).toHaveLength(2);

    expect(program.body[0]).toMatchObject({
      type: "VariableDeclaration",
      kind: "let",
      name: {
        type: "Identifier",
        name: "age",
      },
      initializer: {
        type: "NumberLiteral",
        value: 18,
      },
    });

    expect(program.body[1]).toMatchObject({
      type: "VariableDeclaration",
      kind: "const",
      name: {
        type: "Identifier",
        name: "name",
      },
      initializer: {
        type: "StringLiteral",
        value: "Joao",
      },
    });
  });

  it("parses boolean and null literals", () => {
    const program = parse(`
      let active = true
      let disabled = false
      let value = null
    `);

    expect(program.body[0]).toMatchObject({
      type: "VariableDeclaration",
      initializer: {
        type: "BooleanLiteral",
        value: true,
      },
    });

    expect(program.body[1]).toMatchObject({
      type: "VariableDeclaration",
      initializer: {
        type: "BooleanLiteral",
        value: false,
      },
    });

    expect(program.body[2]).toMatchObject({
      type: "VariableDeclaration",
      initializer: {
        type: "NullLiteral",
        value: null,
      },
    });
  });

  it("respects arithmetic operator precedence", () => {
    const program = parse(
      "let result = 10 + 5 * 2",
    );

    const declaration = program.body[0];

    expect(declaration).toMatchObject({
      type: "VariableDeclaration",
      initializer: {
        type: "BinaryExpression",
        operator: "+",
        left: {
          type: "NumberLiteral",
          value: 10,
        },
        right: {
          type: "BinaryExpression",
          operator: "*",
          left: {
            type: "NumberLiteral",
            value: 5,
          },
          right: {
            type: "NumberLiteral",
            value: 2,
          },
        },
      },
    });
  });

  it("respects logical and comparison precedence", () => {
    const program = parse(`
      let allowed = age >= 18 && score > 90
    `);

    expect(program.body[0]).toMatchObject({
      type: "VariableDeclaration",
      initializer: {
        type: "BinaryExpression",
        operator: "&&",
        left: {
          type: "BinaryExpression",
          operator: ">=",
        },
        right: {
          type: "BinaryExpression",
          operator: ">",
        },
      },
    });
  });

  it("parses grouped expressions", () => {
    const program = parse(
      "let result = (10 + 5) * 2",
    );

    expect(program.body[0]).toMatchObject({
      type: "VariableDeclaration",
      initializer: {
        type: "BinaryExpression",
        operator: "*",
        left: {
          type: "BinaryExpression",
          operator: "+",
        },
        right: {
          type: "NumberLiteral",
          value: 2,
        },
      },
    });
  });

  it("parses unary expressions", () => {
    const program = parse(`
      let negative = -10
      let opposite = !true
    `);

    expect(program.body[0]).toMatchObject({
      type: "VariableDeclaration",
      initializer: {
        type: "UnaryExpression",
        operator: "-",
        operand: {
          type: "NumberLiteral",
          value: 10,
        },
      },
    });

    expect(program.body[1]).toMatchObject({
      type: "VariableDeclaration",
      initializer: {
        type: "UnaryExpression",
        operator: "!",
        operand: {
          type: "BooleanLiteral",
          value: true,
        },
      },
    });
  });

  it("parses function declarations", () => {
    const program = parse(`
      fn sum(a, b) {
        return a + b
      }
    `);

    expect(program.body[0]).toMatchObject({
      type: "FunctionDeclaration",
      name: {
        type: "Identifier",
        name: "sum",
      },
      parameters: [
        {
          type: "Identifier",
          name: "a",
        },
        {
          type: "Identifier",
          name: "b",
        },
      ],
      body: {
        type: "BlockStatement",
        body: [
          {
            type: "ReturnStatement",
            value: {
              type: "BinaryExpression",
              operator: "+",
            },
          },
        ],
      },
    });
  });

  it("parses function calls", () => {
    const program = parse(`
      sum(10, 20)
    `);

    expect(program.body[0]).toMatchObject({
      type: "ExpressionStatement",
      expression: {
        type: "CallExpression",
        callee: {
          type: "Identifier",
          name: "sum",
        },
        arguments: [
          {
            type: "NumberLiteral",
            value: 10,
          },
          {
            type: "NumberLiteral",
            value: 20,
          },
        ],
      },
    });
  });

  it("parses print as a built-in function call", () => {
    const program = parse(`
      print("Hello")
    `);

    expect(program.body[0]).toMatchObject({
      type: "ExpressionStatement",
      expression: {
        type: "CallExpression",
        callee: {
          type: "Identifier",
          name: "print",
        },
        arguments: [
          {
            type: "StringLiteral",
            value: "Hello",
          },
        ],
      },
    });
  });

  it("parses if and else statements", () => {
    const program = parse(`
      if (age >= 18) {
        print("Allowed")
      } else {
        print("Denied")
      }
    `);

    expect(program.body[0]).toMatchObject({
      type: "IfStatement",
      condition: {
        type: "BinaryExpression",
        operator: ">=",
      },
      consequent: {
        type: "BlockStatement",
      },
      alternate: {
        type: "BlockStatement",
      },
    });
  });

  it("parses else-if statements", () => {
    const program = parse(`
      if (score > 90) {
        print("A")
      } else if (score > 80) {
        print("B")
      } else {
        print("C")
      }
    `);

    expect(program.body[0]).toMatchObject({
      type: "IfStatement",
      alternate: {
        type: "IfStatement",
        alternate: {
          type: "BlockStatement",
        },
      },
    });
  });

  it("parses while statements", () => {
    const program = parse(`
      while (count < 5) {
        count = count + 1
      }
    `);

    expect(program.body[0]).toMatchObject({
      type: "WhileStatement",
      condition: {
        type: "BinaryExpression",
        operator: "<",
      },
      body: {
        type: "BlockStatement",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "AssignmentExpression",
              target: {
                type: "Identifier",
                name: "count",
              },
            },
          },
        ],
      },
    });
  });

  it("parses assignments", () => {
    const program = parse(`
      count = count + 1
    `);

    expect(program.body[0]).toMatchObject({
      type: "ExpressionStatement",
      expression: {
        type: "AssignmentExpression",
        target: {
          type: "Identifier",
          name: "count",
        },
        value: {
          type: "BinaryExpression",
          operator: "+",
        },
      },
    });
  });

  it("supports optional semicolons", () => {
    const program = parse(`
      let age = 18;
      print(age);
    `);

    expect(program.body).toHaveLength(2);
  });

  it("throws when variable initializer is missing", () => {
    expect(
      () => parse("let age ="),
    ).toThrow(ParserError);

    expect(
      () => parse("let age ="),
    ).toThrow(
      "Expected expression after '='.",
    );
  });

  it("throws when variable name is missing", () => {
    expect(
      () => parse("let = 18"),
    ).toThrow(
      "Expected variable name after 'let'.",
    );
  });

  it("throws on invalid assignment targets", () => {
    expect(
      () => parse("(10 + 20) = 30"),
    ).toThrow(
      "Invalid assignment target.",
    );
  });

  it("throws when a block is not closed", () => {
    expect(
      () =>
        parse(`
          if (true) {
            print("Hello")
        `),
    ).toThrow(
      "Expected '}' after block.",
    );
  });
});