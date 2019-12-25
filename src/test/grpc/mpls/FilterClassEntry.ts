export class FilterClassEntry {
  private readonly _name: string;
  private _srcMac: string = "";
  private _dstMac: string = "";
  private _vlan: number = 0;
  private _cos: number = 0;
  private _etherType: number = 0;
  private _srcIp: number = 0;
  private _srcIpMaskLen: number = 0;
  private _dstIp: number = 0;
  private _dstIpMaskLen: number = 0;
  private _dscp: number = 0;
  private _protocol: number = 0;
  private _srcPort: number = 0;
  private _dstPort: number = 0;

  constructor(name: string) {
    this._name = name;
    this._srcMac = "";
    this._dstMac = "";
    this._vlan = 0;
    this._cos = 0; // 0-7
    this._etherType = 0;
    this._srcIp = 0;
    this._srcIpMaskLen = 0;
    this._dstIp = 0;
    this._dstIpMaskLen = 0;
    this._dscp = 0;
    this._protocol = 0;
    this._srcPort = 0;
    this._dstPort = 0;
  }

  get name(): string {
    return this._name;
  }

  get srcMac(): string {
    return this._srcMac;
  }

  set srcMac(value: string) {
    this._srcMac = value;
  }

  get dstMac(): string {
    return this._dstMac;
  }

  set dstMac(value: string) {
    this._dstMac = value;
  }

  get vlan(): number {
    return this._vlan;
  }

  set vlan(value: number) {
    this._vlan = value;
  }

  get cos(): number {
    return this._cos;
  }

  set cos(value: number) {
    this._cos = value;
  }

  get etherType(): number {
    return this._etherType;
  }

  set etherType(value: number) {
    this._etherType = value;
  }

  get srcIp(): number {
    return this._srcIp;
  }

  set srcIp(value: number) {
    this._srcIp = value;
  }

  get srcIpMaskLen(): number {
    return this._srcIpMaskLen;
  }

  set srcIpMaskLen(value: number) {
    this._srcIpMaskLen = value;
  }

  get dstIp(): number {
    return this._dstIp;
  }

  set dstIp(value: number) {
    this._dstIp = value;
  }

  get dstIpMaskLen(): number {
    return this._dstIpMaskLen;
  }

  set dstIpMaskLen(value: number) {
    this._dstIpMaskLen = value;
  }

  get dscp(): number {
    return this._dscp;
  }

  set dscp(value: number) {
    this._dscp = value;
  }

  get protocol(): number {
    return this._protocol;
  }

  set protocol(value: number) {
    this._protocol = value;
  }

  get srcPort(): number {
    return this._srcPort;
  }

  set srcPort(value: number) {
    this._srcPort = value;
  }

  get dstPort(): number {
    return this._dstPort;
  }

  set dstPort(value: number) {
    this._dstPort = value;
  }

  public getFilterClass(): object {
    const fc = {
      name: this._name,
      src_mac: this._srcMac,
      dst_mac: this._dstMac,
      vlan: this._vlan,
      cos: this._cos,
      ether_type: this._etherType,
      src_ip: this._srcIp,
      src_ip_mask_len: this._srcIpMaskLen,
      dst_ip: this._dstIp,
      dst_ip_mask_len: this._dstIpMaskLen,
      dscp: this._dscp,
      protocol: this._protocol,
      src_port: this._srcPort,
      dst_port: this._dstPort
    };

    if (fc.src_mac === "") delete fc.src_mac;
    if (fc.dst_mac === "") delete fc.dst_mac;
    if (fc.vlan === 0) delete fc.vlan;
    if (fc.cos === 0) delete fc.cos;
    if (fc.ether_type === 0) delete fc.ether_type;
    if (fc.src_ip === 0) delete fc.src_ip;
    if (fc.src_ip_mask_len === 0) delete fc.src_ip_mask_len;
    if (fc.dst_ip === 0) delete fc.dst_ip;
    if (fc.dst_ip_mask_len === 0) delete fc.dst_ip_mask_len;
    if (fc.dscp === 0) delete fc.dscp;
    if (fc.protocol === 0) delete fc.protocol;
    if (fc.src_port === 0) delete fc.src_port;
    if (fc.dst_port === 0) delete fc.dst_port;
    //
    return fc;
  }

  public compareTo(fc: FilterClassEntry): boolean {
    return (
      this._name === fc._name &&
      this._srcMac === fc._srcMac &&
      this._dstMac === fc._dstMac &&
      this._vlan === fc._vlan &&
      this._cos === fc._cos &&
      this._etherType === fc._etherType &&
      this._srcIp === fc._srcIp &&
      this._srcIpMaskLen === fc._srcIpMaskLen &&
      this._dstIp === fc._dstIp &&
      this._dstIpMaskLen === fc._dstIpMaskLen &&
      this._dscp === fc._dscp &&
      this._protocol === fc._protocol &&
      this._srcPort === fc._srcPort &&
      this._dstPort === fc._dstPort
    );
  }
}
