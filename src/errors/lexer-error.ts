import { JaoError } from "./jao-error.js";

export class LexerError extends JaoError {
  constructor(
    message: string,
    line: number,
    column: number,
  ) {
    super(message, line, column);

    this.name = "JaoLang LexerError";
  }
}