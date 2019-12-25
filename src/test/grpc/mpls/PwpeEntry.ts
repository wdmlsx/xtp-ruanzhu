import { CommonKey } from "./CommonKey";
import { EnableSel } from "./EnableSel";

export class PwpeEntry {
  private _key: CommonKey;
  private _inlabel: number;
  private _outlabel: number;
  private _statsEn: EnableSel.SEL_INVALID;
  private _oam: object;
  private _tunnel: string;
  private _ctrlLocalId: number;

  constructor(key: CommonKey) {
    this._key = key;
    this.inlabel = 1048576;
    this.outlabel = 1048576;
    this.tunnel = "";
  }

  get key(): CommonKey {
    return this._key;
  }

  get inlabel(): number {
    return this._inlabel;
  }

  set inlabel(value: number) {
    this._inlabel = value;
  }

  get outlabel(): number {
    return this._outlabel;
  }

  set outlabel(value: number) {
    this._outlabel = value;
  }

  get statsEn(): EnableSel.SEL_INVALID {
    return this._statsEn;
  }

  set statsEn(value: EnableSel.SEL_INVALID) {
    this._statsEn = value;
  }

  get oam(): object {
    return this._oam;
  }

  set oam(value: object) {
    this._oam = value;
  }

  get tunnel(): string {
    return this._tunnel;
  }

  set tunnel(value: string) {
    this._tunnel = value;
  }

  get ctrlLocalId(): number {
    return this._ctrlLocalId;
  }

  set ctrlLocalId(value: number) {
    this._ctrlLocalId = value;
  }

  public getPwpe(): object {
    const pwpe = {
      key: this._key.getKey(),
      inlabel: this.inlabel === 1048576 ? 0 : this.inlabel,
      outlabel: this.outlabel === 1048576 ? 0 : this.outlabel,
      // stats_en: this.statsEn,
      // oam: this.oam,
      tunnel_smart_group_key: this.tunnel
      // ctrl_local_id: this.ctrlLocalId
    };
    if (pwpe.inlabel === 0) delete pwpe.inlabel;
    if (pwpe.outlabel === 0) delete pwpe.outlabel;
    if (pwpe.tunnel_smart_group_key === "") delete pwpe.tunnel_smart_group_key;
    return pwpe;
  }

  public compareTo(pwpe: PwpeEntry) {
    return (
      this._key.compareTo(pwpe._key) &&
      this.inlabel === pwpe.inlabel &&
      this.outlabel === pwpe.outlabel &&
      this.tunnel === pwpe.tunnel
    );
  }
}
