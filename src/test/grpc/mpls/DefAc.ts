import { DefAcType } from "./DefAcType";

export class DefAc {
  private _inter: string = "";
  private _vlan: number = 0;
  private _fc: string = "";
  private _type: string = DefAcType[DefAcType.ROOT];
  private _cos: number = 0;
  private _rxOctets: string = "0";
  private _txOctets: string = "0";
  private _rxPkts: string = "0";
  private _txPkts: string = "0";
  private _sp: string = "";
  private _acId: number = 0;

  private _vpws: string;

  constructor() {
    this.type = DefAcType[DefAcType.ROOT];
  }

  get inter(): string {
    return this._inter;
  }

  set inter(value: string) {
    this._inter = value;
  }

  get vlan(): number {
    return this._vlan;
  }

  set vlan(value: number) {
    this._vlan = value;
  }

  get fc(): string {
    return this._fc;
  }

  set fc(value: string) {
    this._fc = value;
  }

  get type(): string {
    return this._type;
  }

  set type(value: string) {
    this._type = value;
  }

  get cos(): number {
    return this._cos;
  }

  set cos(value: number) {
    this._cos = value;
  }

  get rxOctets(): string {
    return this._rxOctets;
  }

  set rxOctets(value: string) {
    this._rxOctets = value;
  }

  get txOctets(): string {
    return this._txOctets;
  }

  set txOctets(value: string) {
    this._txOctets = value;
  }

  get rxPkts(): string {
    return this._rxPkts;
  }

  set rxPkts(value: string) {
    this._rxPkts = value;
  }

  get txPkts(): string {
    return this._txPkts;
  }

  set txPkts(value: string) {
    this._txPkts = value;
  }

  get sp(): string {
    return this._sp;
  }

  set sp(value: string) {
    this._sp = value;
  }

  get acId(): number {
    return this._acId;
  }

  set acId(value: number) {
    this._acId = value;
  }

  get vpws(): string {
    return this._vpws;
  }

  set vpws(value: string) {
    this._vpws = value;
  }

  public compareTo(ac: DefAc): boolean {
    return (
      ac.inter === this.inter &&
      ac.vlan === this.vlan &&
      ac.fc === this.fc &&
      ac.cos === this.cos
    );
  }
}
