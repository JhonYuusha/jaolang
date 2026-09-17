export interface SourceLocation {
  line: number;
  column: number;
}

export interface Program {
  type: "Program";
  body: Statement[];
}

export type Statement =
  | VariableDeclaration
  | FunctionDeclaration
  | ReturnStatement
  | IfStatement
  | WhileStatement
  | BlockStatement
  | ExpressionStatement;

export type Expression =
  | Identifier
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | NullLiteral
  | BinaryExpression
  | UnaryExpression
  | AssignmentExpression
  | CallExpression;

export interface VariableDeclaration {
  type: "VariableDeclaration";
  kind: "let" | "const";
  name: Identifier;
  initializer: Expression;
  location: SourceLocation;
}

export interface FunctionDeclaration {
  type: "FunctionDeclaration";
  name: Identifier;
  parameters: Identifier[];
  body: BlockStatement;
  location: SourceLocation;
}

export interface ReturnStatement {
  type: "ReturnStatement";
  value: Expression | null;
  location: SourceLocation;
}

export interface IfStatement {
  type: "IfStatement";
  condition: Expression;
  consequent: BlockStatement;
  alternate:
    | BlockStatement
    | IfStatement
    | null;
  location: SourceLocation;
}

export interface WhileStatement {
  type: "WhileStatement";
  condition: Expression;
  body: BlockStatement;
  location: SourceLocation;
}

export interface BlockStatement {
  type: "BlockStatement";
  body: Statement[];
  location: SourceLocation;
}

export interface ExpressionStatement {
  type: "ExpressionStatement";
  expression: Expression;
  location: SourceLocation;
}

export interface Identifier {
  type: "Identifier";
  name: string;
  location: SourceLocation;
}

export interface NumberLiteral {
  type: "NumberLiteral";
  value: number;
  location: SourceLocation;
}

export interface StringLiteral {
  type: "StringLiteral";
  value: string;
  location: SourceLocation;
}

export interface BooleanLiteral {
  type: "BooleanLiteral";
  value: boolean;
  location: SourceLocation;
}

export interface NullLiteral {
  type: "NullLiteral";
  value: null;
  location: SourceLocation;
}

export interface BinaryExpression {
  type: "BinaryExpression";
  operator:
    | "+"
    | "-"
    | "*"
    | "/"
    | "%"
    | "=="
    | "!="
    | ">"
    | ">="
    | "<"
    | "<="
    | "&&"
    | "||";

  left: Expression;
  right: Expression;

  location: SourceLocation;
}

export interface UnaryExpression {
  type: "UnaryExpression";
  operator: "!" | "-";
  operand: Expression;
  location: SourceLocation;
}

export interface AssignmentExpression {
  type: "AssignmentExpression";
  target: Identifier;
  value: Expression;
  location: SourceLocation;
}

export interface CallExpression {
  type: "CallExpression";
  callee: Identifier;
  arguments: Expression[];
  location: SourceLocation;
}