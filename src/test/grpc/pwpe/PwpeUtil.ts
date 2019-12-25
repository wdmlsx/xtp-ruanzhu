import { LsppeEntry } from "../mpls/LsppeEntry";
import { TunnelEntry } from "../mpls/TunnelEntry";

export class PwpeUtil {
  private _ports: Array<string> = [];
  private _lsppeEntries: Array<LsppeEntry> = [];
  private _tunnelEntries: Array<TunnelEntry> = [];

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

  get tunnelEntries(): Array<TunnelEntry> {
    return this._tunnelEntries;
  }

  set tunnelEntries(value: Array<TunnelEntry>) {
    this._tunnelEntries = value;
  }
}
