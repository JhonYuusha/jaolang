export class JaoError extends Error {
  constructor(
    message: string,
    public readonly line: number,
    public readonly column: number,
  ) {
    super(message);

    this.name = "JaoError";
  }
}