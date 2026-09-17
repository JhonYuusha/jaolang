import { TokenType } from "./token-type.js";

export interface Token {
  type: TokenType;
  lexeme: string;
  line: number;
  column: number;
}