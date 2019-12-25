export class CommonKey {
  private readonly _name: string;

  constructor(name: string) {
    this._name = name;
  }

  get name(): string {
    return this._name;
  }

  public getKey(): object {
    return { name: this._name };
  }

  public compareTo(key: CommonKey) {
    return key._name === this._name;
  }
}
