export default class ErrorBase<T extends string> extends Error {
  public readonly name: T;

  constructor(name: T, message?: string) {
    super(message);
    this.name = name;
  }
}
