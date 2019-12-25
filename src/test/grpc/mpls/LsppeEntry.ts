import { CommonKey } from "./CommonKey";
import { DefStatus } from "./DefStatus";
import { DefBhhEvent } from "./DefBhhEvent";

export class LsppeEntry {
  private readonly _key: CommonKey;
  private _inLabel: number;
  private _outLabel: number;
  private _nexthopIp: number;
  private _port: number;
  private _destMac: string;
  private _bhhAuto: number;
  private _oam: object;
  private _statsEn: number;
  private _serviceQueue: string;
  private _status: string;
  private _bhhStatus: string;
  private _oif: string;
  private _ctrlLocalId: number;

  private _weight: number = 0;

  constructor(key: CommonKey) {
    this._key = key;
    this.inLabel = 0;
    this.outLabel = 0;
    this.nexthopIp = 0;
    this.port = 0;
    this.destMac = "";
    this.bhhAuto = 0;
    this.oam = null;
    this.statsEn = 0;
    this.serviceQueue = "";
    this.status = DefStatus[DefStatus.MPLS_DOWN];
    this.bhhStatus = DefBhhEvent[DefBhhEvent.BHH_INIT];
    this.oif = "";
    this.ctrlLocalId = 0;
  }

  get key(): CommonKey {
    return this._key;
  }

  get inLabel(): number {
    return this._inLabel;
  }

  set inLabel(value: number) {
    this._inLabel = value;
  }

  get outLabel(): number {
    return this._outLabel;
  }

  set outLabel(value: number) {
    this._outLabel = value;
  }

  get nexthopIp(): number {
    return this._nexthopIp;
  }

  set nexthopIp(value: number) {
    this._nexthopIp = value;
  }

  get port(): number {
    return this._port;
  }

  set port(value: number) {
    this._port = value;
  }

  get destMac(): string {
    return this._destMac;
  }

  set destMac(value: string) {
    this._destMac = value;
  }

  get bhhAuto(): number {
    return this._bhhAuto;
  }

  set bhhAuto(value: number) {
    this._bhhAuto = value;
  }

  get oam(): object {
    return this._oam;
  }

  set oam(value: object) {
    this._oam = value;
  }

  get statsEn(): number {
    return this._statsEn;
  }

  set statsEn(value: number) {
    this._statsEn = value;
  }

  get serviceQueue(): string {
    return this._serviceQueue;
  }

  set serviceQueue(value: string) {
    this._serviceQueue = value;
  }

  get status(): string {
    return this._status;
  }

  set status(value: string) {
    this._status = value;
  }

  get bhhStatus(): string {
    return this._bhhStatus;
  }

  set bhhStatus(value: string) {
    this._bhhStatus = value;
  }

  get oif(): string {
    return this._oif;
  }

  set oif(value: string) {
    this._oif = value;
  }

  get ctrlLocalId(): number {
    return this._ctrlLocalId;
  }

  set ctrlLocalId(value: number) {
    this._ctrlLocalId = value;
  }

  get weight(): number {
    return this._weight;
  }

  set weight(value: number) {
    this._weight = value;
  }

  public getObj(): object {
    const lsppe = {
      key: this._key.getKey(),
      inlabel: this.inLabel,
      outlabel: this.outLabel,
      nexthop_ip: this.nexthopIp,
      port: this.port,
      dest_mac: this.destMac,
      bhh_auto: this.bhhAuto,
      oam: this.oam,
      stats_en: this.statsEn,
      service_queue: this.serviceQueue
    };
    if (lsppe.inlabel === 0) delete lsppe.inlabel;
    if (lsppe.outlabel === 0) delete lsppe.outlabel;
    if (lsppe.nexthop_ip === 0) delete lsppe.nexthop_ip;
    if (lsppe.port === 0) delete lsppe.port;
    if (lsppe.dest_mac === "") delete lsppe.dest_mac;
    if (lsppe.bhh_auto === 0) delete lsppe.bhh_auto;
    if (lsppe.oam === null) delete lsppe.oam;
    if (lsppe.stats_en === 0) delete lsppe.stats_en;
    if (lsppe.service_queue === "") delete lsppe.service_queue;
    return lsppe;
  }

  public compareTo(lsppe: LsppeEntry) {
    return (
      lsppe._key.compareTo(this._key) &&
      lsppe.inLabel === this.inLabel &&
      lsppe.outLabel === this.outLabel &&
      lsppe.nexthopIp === this.nexthopIp
    );
  }
}
