export class StormEntry {
  private _portName: string;
  private _uMode: string;
  private _bMode: string;
  private _mMode: string;
  private _uLevel: string;
  private _bLevel: string;
  private _mLevel: string;

  constructor(portName: string) {
    this._portName = portName;
    this._bMode = "Disable";
    this._uMode = "Disable";
    this._mMode = "Disable";
    this._bLevel = "";
    this._uLevel = "";
    this._mLevel = "";
  }

  get portName(): string {
    return this._portName;
  }

  set portName(value: string) {
    this._portName = value;
  }

  get uMode(): string {
    return this._uMode;
  }

  set uMode(value: string) {
    this._uMode = value;
  }

  get bMode(): string {
    return this._bMode;
  }

  set bMode(value: string) {
    this._bMode = value;
  }

  get mMode(): string {
    return this._mMode;
  }

  set mMode(value: string) {
    this._mMode = value;
  }

  get uLevel(): string {
    return this._uLevel;
  }

  set uLevel(value: string) {
    this._uLevel = value;
  }

  get bLevel(): string {
    return this._bLevel;
  }

  set bLevel(value: string) {
    this._bLevel = value;
  }

  get mLevel(): string {
    return this._mLevel;
  }

  set mLevel(value: string) {
    this._mLevel = value;
  }

  public compare(stormEntry: StormEntry): boolean {
    return (
      stormEntry.portName === this.portName &&
      stormEntry.uMode === this.uMode &&
      stormEntry.uLevel === this.uLevel &&
      stormEntry.mMode === this.mMode &&
      stormEntry.mLevel === this.mLevel &&
      stormEntry.bMode === this.bMode &&
      stormEntry.bLevel === this.bLevel
    );
  }
}
