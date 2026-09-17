import { JaoError } from "./jao-error.js";

export class ParserError extends JaoError {
  constructor(
    message: string,
    line: number,
    column: number,
  ) {
    super(message, line, column);

    this.name = "JaoLang ParserError";
  }
}