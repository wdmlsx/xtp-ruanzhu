import { CommonKey } from "./CommonKey";
import { DefStatus } from "./DefStatus";
import { DefAc } from "./DefAc";
import { DefPeer } from "./DefPeer";

export class VpwsEntry {
  private readonly _key: CommonKey;
  private _wokPwpe: string = "";
  private _status: string = DefStatus[DefStatus.MPLS_DOWN];
  private _acs: Array<DefAc> = [];
  private _peer: DefPeer = new DefPeer();
  private _vpwsId: number = 0;

  constructor(key: CommonKey) {
    this._key = key;
    this.peer = new DefPeer();
  }

  get key(): CommonKey {
    return this._key;
  }

  get wokPwpe(): string {
    return this._wokPwpe;
  }

  set wokPwpe(value: string) {
    this._wokPwpe = value;
  }

  get status(): string {
    return this._status;
  }

  set status(value: string) {
    this._status = value;
  }

  get acs(): Array<DefAc> {
    return this._acs;
  }

  set acs(value: Array<DefAc>) {
    this._acs = value;
  }

  get peer(): DefPeer {
    return this._peer;
  }

  set peer(value: DefPeer) {
    this._peer = value;
  }

  get vpwsId(): number {
    return this._vpwsId;
  }

  set vpwsId(value: number) {
    this._vpwsId = value;
  }

  public compareTo(vpws: VpwsEntry): boolean {
    return (
      vpws.key.compareTo(this.key) &&
      vpws.wokPwpe === this.wokPwpe &&
      vpws.peer.compareTo(this.peer) &&
      vpws.acs.length === this.acs.length &&
      vpws.acs.filter(
        acs_target =>
          this.acs.filter(acs_origin => acs_origin.compareTo(acs_target))
            .length === 1
      ).length === this.acs.length
    );
  }
}
