import { readFileSync } from "node:fs";

import { Lexer } from "./lexer/lexer.js";
import { JaoError } from "./errors/jao-error.js";

function main(): void {
  const source = readFileSync(
    "./examples/hello.jao",
    "utf-8",
  );

  try {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    console.table(tokens);
  } catch (error) {
    if (error instanceof JaoError) {
      console.error(
        `${error.name}: ${error.message}`,
      );

      console.error(
        `at ${error.line}:${error.column}`,
      );

      process.exitCode = 1;
      return;
    }

    throw error;
  }
}

main();