import { CommonKey } from "./CommonKey";
import { DefProtectLsp } from "./DefProtectLsp";
import { DefApsRevertMode } from "./DefApsRevertMode";

export class TunnelEntry {
  private readonly _key: CommonKey;
  private _workLsp: string;
  private _protectLsp: Array<DefProtectLsp>;
  private _revertMode: DefApsRevertMode;
  private _wtr: DefApsRevertMode;
  private _lsp2switch: string;
  private _ctrlLocalId: number;

  constructor(key: CommonKey) {
    this._key = key;
    this.workLsp = "";
    this.protectLsp = new Array<DefProtectLsp>();
    this.revertMode = DefApsRevertMode.APS_MODE_INVALID;
    this.wtr = DefApsRevertMode.APS_MODE_INVALID;
    this.lsp2switch = "";
    this.ctrlLocalId = 0;
  }

  get key(): CommonKey {
    return this._key;
  }

  get workLsp(): string {
    return this._workLsp;
  }

  set workLsp(value: string) {
    this._workLsp = value;
  }

  get protectLsp(): Array<DefProtectLsp> {
    return this._protectLsp;
  }

  set protectLsp(value: Array<DefProtectLsp>) {
    this._protectLsp = value;
  }

  get revertMode(): DefApsRevertMode {
    return this._revertMode;
  }

  set revertMode(value: DefApsRevertMode) {
    this._revertMode = value;
  }

  get wtr(): DefApsRevertMode {
    return this._wtr;
  }

  set wtr(value: DefApsRevertMode) {
    this._wtr = value;
  }

  get lsp2switch(): string {
    return this._lsp2switch;
  }

  set lsp2switch(value: string) {
    this._lsp2switch = value;
  }

  get ctrlLocalId(): number {
    return this._ctrlLocalId;
  }

  set ctrlLocalId(value: number) {
    this._ctrlLocalId = value;
  }

  public getTunnel(): object {
    const param = {
      key: this._key.getKey(),
      work_lsp: this.workLsp,
      protect_lsp: this.protectLsp
      // revert_mod: this.revertMode,
      // wtr: this.wtr,
      // lsp2switch: this.lsp2switch,
      // ctrl_local_id: this.ctrlLocalId
    };
    if (param.work_lsp === "") delete param.work_lsp;
    if (param.protect_lsp.length === 0) delete param.protect_lsp;
    return param;
  }

  /*
   * key
   * worklsp
   * protect lsp
   * */
  public compareTo(tunnel: TunnelEntry) {
    return (
      tunnel._key.compareTo(this._key) &&
      tunnel.workLsp === this.workLsp &&
      tunnel.protectLsp.length === this.protectLsp.length &&
      tunnel.protectLsp.filter(
        defPl_param =>
          this.protectLsp.filter(defPl_origin =>
            defPl_origin.compareTo(defPl_param)
          ).length === 1
      ).length === tunnel.protectLsp.length
    );
  }
}
