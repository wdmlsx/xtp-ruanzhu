import { CommonKey } from "./CommonKey";
import { DefStatus } from "./DefStatus";

export class LsppEntry {
  private readonly _key: CommonKey;
  private _inlabelEast: number = 0;
  private _outlabelEast: number = 0;
  private _nexthopIpEast: number = 0;
  private _inlabelWest: number = 0;
  private _outlabelWest: number = 0;
  private _nexthopIpWest: number = 0;
  private _portEast: number;
  private _destMacEast: string;
  private _portWest: number;
  private _destMacWest: number;
  private _oam: object;
  private _statusEast: DefStatus.MPLS_DOWN;
  private _statusWest: DefStatus.MPLS_DOWN;

  constructor(key: CommonKey) {
    this._key = key;
  }

  get key(): CommonKey {
    return this._key;
  }

  get inlabelEast(): number {
    return this._inlabelEast;
  }

  set inlabelEast(value: number) {
    this._inlabelEast = value;
  }

  get outlabelEast(): number {
    return this._outlabelEast;
  }

  set outlabelEast(value: number) {
    this._outlabelEast = value;
  }

  get nexthopIpEast(): number {
    return this._nexthopIpEast;
  }

  set nexthopIpEast(value: number) {
    this._nexthopIpEast = value;
  }

  get inlabelWest(): number {
    return this._inlabelWest;
  }

  set inlabelWest(value: number) {
    this._inlabelWest = value;
  }

  get outlabelWest(): number {
    return this._outlabelWest;
  }

  set outlabelWest(value: number) {
    this._outlabelWest = value;
  }

  get nexthopIpWest(): number {
    return this._nexthopIpWest;
  }

  set nexthopIpWest(value: number) {
    this._nexthopIpWest = value;
  }

  get portEast(): number {
    return this._portEast;
  }

  set portEast(value: number) {
    this._portEast = value;
  }

  get destMacEast(): string {
    return this._destMacEast;
  }

  set destMacEast(value: string) {
    this._destMacEast = value;
  }

  get portWest(): number {
    return this._portWest;
  }

  set portWest(value: number) {
    this._portWest = value;
  }

  get destMacWest(): number {
    return this._destMacWest;
  }

  set destMacWest(value: number) {
    this._destMacWest = value;
  }

  get oam(): object {
    return this._oam;
  }

  set oam(value: object) {
    this._oam = value;
  }

  get statusEast(): DefStatus.MPLS_DOWN {
    return this._statusEast;
  }

  set statusEast(value: DefStatus.MPLS_DOWN) {
    this._statusEast = value;
  }

  get statusWest(): DefStatus.MPLS_DOWN {
    return this._statusWest;
  }

  set statusWest(value: DefStatus.MPLS_DOWN) {
    this._statusWest = value;
  }

  public getObj(): object {
    return {
      key: this._key.getKey(),
      inlabel_east: this.inlabelEast,
      outlabel_east: this.outlabelEast,
      nexthop_ip_east: this.nexthopIpEast,
      inlabel_west: this.inlabelWest,
      outlabel_west: this.outlabelWest,
      nexthop_ip_west: this.nexthopIpWest
    };
  }

  public compareTo(lsppe: LsppEntry) {
    return (
      lsppe._key.compareTo(this._key) &&
      lsppe.inlabelEast === this.inlabelEast &&
      lsppe.inlabelWest === this.inlabelWest &&
      lsppe.outlabelEast === this.outlabelEast &&
      lsppe.outlabelWest === this.outlabelWest &&
      lsppe.nexthopIpEast === this.nexthopIpEast &&
      lsppe.nexthopIpWest === this.nexthopIpWest
    );
  }
}
