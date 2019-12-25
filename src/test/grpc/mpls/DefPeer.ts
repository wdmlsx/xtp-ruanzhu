import { DefStatus } from "./DefStatus";

export class DefPeer {
  private _pw: string = "";
  private _tunnelGroup: string = "";
  private _lsp: string = "";
  private _inlabel: number = 0;
  private _outlabel: number = 0;
  private _pwInter: string = "";
  private _peerStatus: string = DefStatus[DefStatus.MPLS_DOWN];

  constructor() {
    this.pw = "";
    this.tunnelGroup = "";
    this.lsp = "";
    this.inlabel = 0;
    this.outlabel = 0;
    this.pwInter = "";
    this.peerStatus = DefStatus[DefStatus.MPLS_DOWN];
  }

  get pw(): string {
    return this._pw;
  }

  set pw(value: string) {
    this._pw = value;
  }

  get tunnelGroup(): string {
    return this._tunnelGroup;
  }

  set tunnelGroup(value: string) {
    this._tunnelGroup = value;
  }

  get lsp(): string {
    return this._lsp;
  }

  set lsp(value: string) {
    this._lsp = value;
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

  get pwInter(): string {
    return this._pwInter;
  }

  set pwInter(value: string) {
    this._pwInter = value;
  }

  get peerStatus(): string {
    return this._peerStatus;
  }

  set peerStatus(value: string) {
    this._peerStatus = value;
  }

  public compareTo(peer: DefPeer): boolean {
    return (
      peer.pw === this.pw &&
      peer.tunnelGroup === this.tunnelGroup &&
      peer.inlabel === this.inlabel &&
      peer.outlabel === this.outlabel
    );
  }
}
