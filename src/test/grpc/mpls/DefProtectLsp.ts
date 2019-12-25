export class DefProtectLsp {
  private readonly _name: string;
  private _weight: number;

  constructor(name: string) {
    this._name = name;
  }

  get name(): string {
    return this._name;
  }

  get weight(): number {
    return this._weight;
  }

  set weight(value: number) {
    this._weight = value;
  }

  public getObj(): object {
    return {
      name: this._name,
      weight: this._weight
    };
  }

  public compareTo(defPl: DefProtectLsp): boolean {
    return defPl._weight === this._weight && defPl._name === this._name;
  }
}
