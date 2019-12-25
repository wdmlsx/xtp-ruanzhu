import { LsppeEntry } from "../mpls/LsppeEntry";

export class TunnelUntil {
  private _ports: Array<string> = [];
  private _lsppeEntries: Array<LsppeEntry> = [];

  get ports(): Array<string> {
    return this._ports;
  }

  set ports(value: Array<string>) {
    this._ports = value;
  }

  get lsppeEntries(): Array<LsppeEntry> {
    return this._lsppeEntries;
  }

  set lsppeEntries(value: Array<LsppeEntry>) {
    this._lsppeEntries = value;
  }
}
