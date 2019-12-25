export class TblTpPeer {
  private readonly _name: string = "";
  private _upe: string;
  private _workPwpe: string = "";

  constructor(name: string) {
    this._name = name;
  }

  get name(): string {
    return this._name;
  }

  get upe(): string {
    return this._upe;
  }

  set upe(value: string) {
    this._upe = value;
  }

  get workPwpe(): string {
    return this._workPwpe;
  }

  set workPwpe(value: string) {
    this._workPwpe = value;
  }
  public compareTo(tblTppeer: TblTpPeer) {
    return tblTppeer.name === this.name && tblTppeer.workPwpe === this.workPwpe;
  }
}
