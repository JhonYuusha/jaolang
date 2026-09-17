import { readFileSync } from "node:fs";

import { JaoError } from "./errors/jao-error.js";
import { Lexer } from "./lexer/lexer.js";
import { Parser } from "./parser/parser.js";

function main(): void {
  const source = readFileSync(
    "./examples/hello.jao",
    "utf-8",
  );

  try {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const program = parser.parse();

    console.dir(program, {
      depth: null,
      colors: true,
    });
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