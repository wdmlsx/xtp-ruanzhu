import { LsppeEntry } from "../mpls/LsppeEntry";
import { TunnelEntry } from "../mpls/TunnelEntry";
import { PwpeEntry } from "../mpls/PwpeEntry";

export class VpwsUtil {
  private _lsppeEntries: Array<LsppeEntry> = [];
  private _tunnelEntries: Array<TunnelEntry> = [];
  private _pwpeEntries: Array<PwpeEntry> = [];
  private _ports: Array<string> = [];

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

  get pwpeEntries(): Array<PwpeEntry> {
    return this._pwpeEntries;
  }

  set pwpeEntries(value: Array<PwpeEntry>) {
    this._pwpeEntries = value;
  }

  get ports(): Array<string> {
    return this._ports;
  }

  set ports(value: Array<string>) {
    this._ports = value;
  }
}
