export class MacEntry {
  private _portName: string;
  private _mac: string;
  private _vlanId: string;
  private _static: string;
  private _forwarding: string;

  constructor(portName: string, mac: string, vlanId: string) {
    this._portName = portName;
    this._mac = mac;
    this._vlanId = vlanId;
  }

  get portName(): string {
    return this._portName;
  }

  set portName(value: string) {
    this._portName = value;
  }

  get mac(): string {
    return this._mac;
  }

  set mac(value: string) {
    this._mac = value;
  }

  get vlanId(): string {
    return this._vlanId;
  }

  set vlanId(value: string) {
    this._vlanId = value;
  }

  get static(): string {
    return this._static;
  }

  set static(value: string) {
    this._static = value;
  }

  get forwarding(): string {
    return this._forwarding;
  }

  set forwarding(value: string) {
    this._forwarding = value;
  }

  public compare(entry: MacEntry) {
    return (
      entry.vlanId === this.vlanId &&
      entry.portName === this.portName &&
      entry.mac === this.mac
    );
  }
}
