import { CommonKey } from "./CommonKey";
import { DefAc } from "./DefAc";
import { TblTpPeer } from "./TblTpPeer";
import { EnableSel } from "./EnableSel";
import { DefPeer } from "./DefPeer";

export class VplsEntry {
  private readonly _key: CommonKey;
  private _acs: Array<DefAc> = [];
  private _tppeers: Array<TblTpPeer> = [];
  private _igmpEn: EnableSel;
  private _igmpVersion: number;
  private _peers: Array<DefPeer> = [];

  private readonly _vplsId: number;

  constructor(key: CommonKey, vplsId: number) {
    this._key = key;
    this._vplsId = vplsId;
  }

  get key(): CommonKey {
    return this._key;
  }

  get vplsId(): number {
    return this._vplsId;
  }

  get acs(): Array<DefAc> {
    return this._acs;
  }

  set acs(value: Array<DefAc>) {
    this._acs = value;
  }

  get tppeers(): Array<TblTpPeer> {
    return this._tppeers;
  }

  set tppeers(value: Array<TblTpPeer>) {
    this._tppeers = value;
  }

  get igmpEn(): EnableSel {
    return this._igmpEn;
  }

  set igmpEn(value: EnableSel) {
    this._igmpEn = value;
  }

  get igmpVersion(): number {
    return this._igmpVersion;
  }

  set igmpVersion(value: number) {
    this._igmpVersion = value;
  }

  get peers(): Array<DefPeer> {
    return this._peers;
  }

  set peers(value: Array<DefPeer>) {
    this._peers = value;
  }

  public compareTo(vpls: VplsEntry) {
    return (
      vpls._key.compareTo(this._key) &&
      vpls.acs.length === this.acs.length &&
      vpls.acs.filter(
        ac_param =>
          this.acs.filter(ac_this => ac_param.compareTo(ac_this)).length === 1
      ).length === this.acs.length &&
      vpls.tppeers.length === this.tppeers.length &&
      vpls.tppeers.filter(
        tppeer_param =>
          this.tppeers.filter(tppeer_this =>
            tppeer_param.compareTo(tppeer_this)
          ).length === 1
      ).length === this.tppeers.length &&
      vpls.peers.length === this.peers.length &&
      vpls.peers.filter(
        peer_param =>
          this.peers.filter(peer_this => peer_param.compareTo(peer_this))
            .length === 1
      ).length === this.peers.length
    );
  }
}
