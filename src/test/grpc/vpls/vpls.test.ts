import {
  AfterEach,
  BeforeAll,
  BeforeEach,
  Describe,
  InjectTopo,
  Test,
  TestOnly
} from "../../../decorators";

import { DoubleDevice } from "../../../topos/double-device";
import { RpcClient } from "@xtp/grpc";
import { Dut } from "@xtp/telnet";
import { ipToNumber, numberToIp } from "../../../utils";
import { PwpeEntry } from "../mpls/PwpeEntry";
import { CommonKey } from "../mpls/CommonKey";
import { LsppeEntry } from "../mpls/LsppeEntry";
import { TunnelEntry } from "../mpls/TunnelEntry";
import { DefProtectLsp } from "../mpls/DefProtectLsp";
import { IDut } from "../../../topos/definitions";
import { VplsEntry } from "../mpls/VplsEntry";
import { TblTpPeer } from "../mpls/TblTpPeer";
import { DefAc } from "../mpls/DefAc";
import { FilterClassEntry } from "../mpls/FilterClassEntry";
import { VplsUtil } from "./VplsUtil";
import { DefPeer } from "../mpls/DefPeer";

@Describe("test mpls vpls")
export class VplsTest {
  @InjectTopo
  private readonly topo: DoubleDevice;

  private dut1: IDut;
  private dut2: IDut;

  private port_ac_08: string;
  private port_ac_10: string;
  private port_ac_12: string;

  @BeforeEach
  private async beforeEach() {
    await this.dut1.cli.connect();
    // await this.dut2.cli.connect();
  }

  @AfterEach
  private async afterEach() {
    await this.dut1.cli.end();
    // await this.dut2.cli.end();
  }

  @BeforeAll
  private async init() {
    this.dut1 = this.topo.dut1;
    this.dut2 = this.topo.dut2;

    this.port_ac_08 = this.dut1.port[7];
    this.port_ac_10 = this.dut1.port[9];
    this.port_ac_12 = this.dut1.port[11];
  }

  @TestOnly("test get all vpls", 300000)
  private async testGetAll() {
    const vplsEntry_01 = new VplsEntry(new CommonKey("vpls_dut_01"), 1000);
    const vplsEntry_02 = new VplsEntry(new CommonKey("vpls_dut_02"), 2000);
    const vplsEntry_03 = new VplsEntry(new CommonKey("vpls_dut_03"), 3000);

    const tppeer_01 = new TblTpPeer("tppeer_01");
    const tppeer_02 = new TblTpPeer("tppeer_02");

    const defAc_01 = new DefAc();
    defAc_01.inter = this.port_ac_08;

    const defAc_02 = new DefAc();
    defAc_02.inter = this.port_ac_10;

    const defAc_03 = new DefAc();
    defAc_03.inter = this.port_ac_12;
    defAc_03.vlan = 100;

    vplsEntry_01.acs.push(defAc_01);
    vplsEntry_02.acs.push(defAc_02);
    vplsEntry_03.acs.push(defAc_03);

    const vplsUtil = await this.addPwpeForTblTpPeer(this.dut1);
    if (vplsUtil !== null) {
      tppeer_01.workPwpe = vplsUtil.pwpeEntries[0].key.name;
      tppeer_02.workPwpe = vplsUtil.pwpeEntries[1].key.name;

      vplsEntry_01.tppeers.push(tppeer_01);
      vplsEntry_02.tppeers.push(tppeer_02);

      const peer_01 = new DefPeer();
      peer_01.pw = vplsUtil.pwpeEntries[0].key.name;
      peer_01.tunnelGroup = vplsUtil.pwpeEntries[0].tunnel;
      peer_01.inlabel = vplsUtil.pwpeEntries[0].inlabel;
      peer_01.outlabel = vplsUtil.pwpeEntries[0].outlabel;

      const peer_02 = new DefPeer();
      peer_02.pw = vplsUtil.pwpeEntries[1].key.name;
      peer_02.tunnelGroup = vplsUtil.pwpeEntries[1].tunnel;
      peer_02.inlabel = vplsUtil.pwpeEntries[1].inlabel;
      peer_02.outlabel = vplsUtil.pwpeEntries[1].outlabel;

      vplsEntry_01.peers.push(peer_01);
      vplsEntry_02.peers.push(peer_02);

      console.log(
        "dut: ",
        JSON.stringify([vplsEntry_01, vplsEntry_02, vplsEntry_03])
      );
      try {
        await this.addVplsByDut(this.dut1.cli, vplsEntry_01);
        await this.addVplsByDut(this.dut1.cli, vplsEntry_02);
        await this.addVplsByDut(this.dut1.cli, vplsEntry_03);

        const vplsEntries = await this.getAllVplsFromRpc(this.dut1.rpc, {
          start: 0,
          end: 0
        });

        console.log("got: ", JSON.stringify(vplsEntries));
        const output = await this.dut1.cli.exec`
          > show run
        `;

        console.log("output", output);
        if (vplsEntries.length > 0) {
          const vplsEntries_got = vplsEntries.filter(
            vplsEntry_got =>
              vplsEntry_got.compareTo(vplsEntry_01) ||
              vplsEntry_got.compareTo(vplsEntry_02) ||
              vplsEntry_got.compareTo(vplsEntry_03)
          );
          expect(vplsEntries_got.length).toEqual(3);
        } else {
          expect(vplsEntries.length).not.toEqual(0);
        }
      } finally {
        await this.delVplsByDut(this.dut1.cli, vplsEntry_01);
        await this.delVplsByDut(this.dut1.cli, vplsEntry_02);
        await this.delVplsByDut(this.dut1.cli, vplsEntry_03);

        await this.delPwpeForTblTpPeer(this.dut1, vplsUtil);
      }
    } else {
      expect(vplsUtil).not.toBeNull();
    }
  }

  @Test("test add vpls with setting a number key")
  private async testAddVplsKey() {
    const vplsEntry = new VplsEntry(new CommonKey("1234"), 1000);
    let hasError = false;
    try {
      const resp = await this.addVplsByRpc(this.dut1.rpc, vplsEntry);

      if (resp.return_code === 0) {
        const vplsEntries = await this.getAllVplsFromDut(this.dut1.cli);

        const vplsEntry_got = vplsEntries.filter(vplsEntry_got =>
          vplsEntry_got.compareTo(vplsEntry)
        );

        expect(vplsEntry_got.length).toEqual(1);
      } else {
        expect(resp.return_code).toEqual(0);
      }
    } catch (e) {
      hasError = true;
    } finally {
      if (!hasError) {
        await this.delVplsByDut(this.dut1.cli, vplsEntry);
      }
    }
    expect(hasError).toBeFalsy();
  }

  @Test("test add vpls with single ac")
  private async testAddVplsWithAc() {
    const vplsEntry = new VplsEntry(new CommonKey("vpls_dut"), 1000);

    const defAc = new DefAc();
    defAc.inter = this.port_ac_08;
    defAc.vlan = 100;

    vplsEntry.acs.push(defAc);
    try {
      const resp = await this.addVplsByRpc(this.dut1.rpc, vplsEntry);

      if (resp.return_code === 0) {
        const vplsEntries = await this.getAllVplsFromDut(this.dut1.cli);

        const vplsEntry_got = vplsEntries.filter(vplsEntry_got =>
          vplsEntry_got.compareTo(vplsEntry)
        );

        expect(vplsEntry_got.length).toEqual(1);
      } else {
        expect(resp.return_code).toEqual(0);
      }
    } finally {
      await this.delVplsByDut(this.dut1.cli, vplsEntry);
    }
  }

  @Test("test add vpls with given two more acs", 30000)
  private async testAddVplsWithAcs() {
    const vplsEntry = new VplsEntry(new CommonKey("vpls_dut"), 1000);

    const defAc_01 = new DefAc();
    defAc_01.inter = this.port_ac_08;
    defAc_01.vlan = 100;

    const defAc_02 = new DefAc();
    defAc_02.inter = this.port_ac_10;

    const defAc_03 = new DefAc();
    defAc_03.inter = this.port_ac_12;
    const fcEntry = new FilterClassEntry("fc_dut");
    fcEntry.cos = 5;

    await this.addFCByDut(this.dut1.cli, fcEntry);
    defAc_03.fc = fcEntry.name;

    vplsEntry.acs.push(defAc_01);
    vplsEntry.acs.push(defAc_02);
    vplsEntry.acs.push(defAc_03);

    try {
      const resp = await this.addVplsByRpc(this.dut1.rpc, vplsEntry);

      if (resp.return_code === 0) {
        const vplsEntries = await this.getAllVplsFromDut(this.dut1.cli);

        const vplsEntry_got = vplsEntries.filter(vplsEntry_got =>
          vplsEntry_got.compareTo(vplsEntry)
        );

        expect(vplsEntry_got.length).toEqual(1);
      } else {
        expect(resp.return_code).toEqual(0);
      }
    } finally {
      await this.delVplsByDut(this.dut1.cli, vplsEntry);
      await this.delFCByDut(this.dut1.cli, fcEntry);
    }
  }

  @Test("test add vpls with single tppeer with single pwpe", 300000)
  private async testAddVplsWithTpPeer() {
    const vplsEntry = new VplsEntry(new CommonKey("vpls_rpc"), 1000);

    // tppeer
    const tppeer = new TblTpPeer("tppeer_rpc");
    const vplsUtil = await this.addPwpeForTblTpPeer(this.dut1);
    if (vplsUtil !== null) {
      tppeer.workPwpe = vplsUtil.pwpeEntries[0].key.name;

      // vplsEntry push tblTppeer
      vplsEntry.tppeers.push(tppeer);

      // peer
      const peer = new DefPeer();
      peer.pw = vplsUtil.pwpeEntries[0].key.name;
      peer.tunnelGroup = vplsUtil.pwpeEntries[0].tunnel;
      peer.inlabel = vplsUtil.pwpeEntries[0].inlabel;
      peer.outlabel = vplsUtil.pwpeEntries[0].outlabel;

      // vplsEntry push peer
      vplsEntry.peers.push(peer);

      try {
        const resp = await this.addVplsByRpc(this.dut1.rpc, vplsEntry);

        if (resp.return_code === 0) {
          const vplsEntries = await this.getAllVplsFromDut(this.dut1.cli);

          const vplsEntry_got = vplsEntries.filter(vplsEntry_got =>
            vplsEntry_got.compareTo(vplsEntry)
          );

          expect(vplsEntry_got.length).toEqual(1);
        } else {
          expect(resp.return_code).toEqual(0);
        }
      } finally {
        await this.delVplsByDut(this.dut1.cli, vplsEntry);
        await this.delPwpeForTblTpPeer(this.dut1, vplsUtil);
      }
    } else {
      expect(vplsUtil).not.toBeNull();
    }
  }

  @Test(
    "test add vpls with three more tppeers and two of them has pwpe",
    300000
  )
  private async testAddVplsWithTpPeers() {
    const vplsEntry = new VplsEntry(new CommonKey("vpls_rpc"), 1000);

    // tppeer
    const tppeer_01 = new TblTpPeer("tppeer_rpc_01");
    const tppeer_02 = new TblTpPeer("tppeer_rpc_02");
    const tppeer_03 = new TblTpPeer("tppeer_rpc_03");

    const vplsUtil = await this.addPwpeForTblTpPeer(this.dut1);
    if (vplsUtil !== null) {
      tppeer_01.workPwpe = vplsUtil.pwpeEntries[0].key.name;
      tppeer_02.workPwpe = vplsUtil.pwpeEntries[1].key.name;

      // vplsEntry push tblTppeer
      vplsEntry.tppeers.push(tppeer_01);
      vplsEntry.tppeers.push(tppeer_02);
      vplsEntry.tppeers.push(tppeer_03);

      // peer
      const peer_01 = new DefPeer();
      peer_01.pw = vplsUtil.pwpeEntries[0].key.name;
      peer_01.tunnelGroup = vplsUtil.pwpeEntries[0].tunnel;
      peer_01.inlabel = vplsUtil.pwpeEntries[0].inlabel;
      peer_01.outlabel = vplsUtil.pwpeEntries[0].outlabel;

      const peer_02 = new DefPeer();
      peer_02.pw = vplsUtil.pwpeEntries[1].key.name;
      peer_02.tunnelGroup = vplsUtil.pwpeEntries[1].tunnel;
      peer_02.inlabel = vplsUtil.pwpeEntries[1].inlabel;
      peer_02.outlabel = vplsUtil.pwpeEntries[1].outlabel;

      // vplsEntry push peer
      vplsEntry.peers.push(peer_01);
      vplsEntry.peers.push(peer_02);

      try {
        const resp = await this.addVplsByRpc(this.dut1.rpc, vplsEntry);

        if (resp.return_code === 0) {
          const vplsEntries = await this.getAllVplsFromDut(this.dut1.cli);

          const vplsEntry_got = vplsEntries.filter(vplsEntry_got =>
            vplsEntry_got.compareTo(vplsEntry)
          );

          expect(vplsEntry_got.length).toEqual(1);
        } else {
          expect(resp.return_code).toEqual(0);
        }
      } finally {
        await this.delVplsByDut(this.dut1.cli, vplsEntry);
        await this.delPwpeForTblTpPeer(this.dut1, vplsUtil);
      }
    } else {
      expect(vplsUtil).not.toBeNull();
    }
  }

  @Test("test add vpls with single ac and single tppeer", 300000)
  private async testAddVpls() {
    const vplsEntry = new VplsEntry(new CommonKey("vpls_rpc"), 1000);

    // ac
    const defAc = new DefAc();
    defAc.inter = this.port_ac_08;
    defAc.vlan = 100;

    // vplsEntry acs push ac
    vplsEntry.acs.push(defAc);

    // tbltppeer
    const tblTpPeer = new TblTpPeer("tppeer_rpc");

    const vplsUtil = await this.addPwpeForTblTpPeer(this.dut1);

    if (vplsUtil !== null) {
      tblTpPeer.workPwpe = vplsUtil.pwpeEntries[0].key.name;

      // vplsEntry tppeers push tbltppeer
      vplsEntry.tppeers.push(tblTpPeer);

      // peer
      const peer = new DefPeer();
      peer.pw = vplsUtil.pwpeEntries[0].key.name;
      peer.tunnelGroup = vplsUtil.pwpeEntries[0].tunnel;
      peer.inlabel = vplsUtil.pwpeEntries[0].inlabel;
      peer.outlabel = vplsUtil.pwpeEntries[0].outlabel;

      // vplsEntry peers push peer
      vplsEntry.peers.push(peer);

      try {
        const resp = await this.addVplsByRpc(this.dut1.rpc, vplsEntry);

        if (resp.return_code === 0) {
          const vplsEntries = await this.getAllVplsFromDut(this.dut1.cli);

          const vplsEntry_got = vplsEntries.filter(vplsEntry_got =>
            vplsEntry_got.compareTo(vplsEntry)
          );

          expect(vplsEntry_got.length).toEqual(1);
        } else {
          expect(resp.return_code).toEqual(0);
        }
      } finally {
        await this.delVplsByDut(this.dut1.cli, vplsEntry);
        await this.delPwpeForTblTpPeer(this.dut1, vplsUtil);
      }
    } else {
      expect(vplsUtil).not.toBeNull();
    }
  }

  @Test("test del vpls", 30000)
  private async testDelVpls() {
    const vplsEntry = new VplsEntry(new CommonKey("vpls_dut"), 1000);

    try {
      await this.addVplsByDut(this.dut1.cli, vplsEntry);

      const resp = await this.delVplsByRpc(this.dut1.rpc, vplsEntry);

      if (resp.return_code === 0) {
        const vplsEntries = await this.getAllVplsFromDut(this.dut1.cli);

        const vplsEntry_got = vplsEntries.filter(vplsEntry_got =>
          vplsEntry_got.compareTo(vplsEntry)
        );

        expect(vplsEntry_got.length).toEqual(0);
      } else {
        expect(resp.return_code).toEqual(0);
      }
    } finally {
      //
    }
  }

  @Test("test set an ac in a vpls which has no ac before setting", 30000)
  private async testSetAc_add() {
    const vplsEntry = new VplsEntry(new CommonKey("vpls_dut"), 1000);

    try {
      await this.addVplsByDut(this.dut1.cli, vplsEntry);

      const vplsEntry_set = new VplsEntry(vplsEntry.key, vplsEntry.vplsId);

      const defAc = new DefAc();
      defAc.inter = this.port_ac_08;
      defAc.cos = 5;

      vplsEntry_set.acs.push(defAc);

      vplsEntry.acs = vplsEntry_set.acs;

      const resp = await this.setVplsByRpc(this.dut1.rpc, vplsEntry_set);

      if (resp.return_code === 0) {
        const vplsEntries = await this.getAllVplsFromDut(this.dut1.cli);

        const vplsEntry_got = vplsEntries.filter(vplsEntry_got =>
          vplsEntry_got.compareTo(vplsEntry)
        );

        expect(vplsEntry_got.length).toEqual(1);
      } else {
        expect(resp.return_code).toEqual(0);
      }
    } finally {
      //
      await this.delVplsByDut(this.dut1.cli, vplsEntry);
    }
  }

  @Test(
    "test set a different ac in a vpls which has an ac before setting",
    30000
  )
  private async testSetAc_update() {
    const vplsEntry = new VplsEntry(new CommonKey("vpls_dut"), 1000);

    const defAc = new DefAc();
    defAc.inter = this.port_ac_08;
    defAc.vlan = 100;
    defAc.cos = 4;

    vplsEntry.acs.push(defAc);

    try {
      await this.addVplsByDut(this.dut1.cli, vplsEntry);

      const vplsEntry_set = new VplsEntry(vplsEntry.key, vplsEntry.vplsId);

      const defAc_set = new DefAc();
      defAc_set.inter = this.port_ac_08;
      defAc_set.cos = 5;

      vplsEntry_set.acs.push(defAc_set);

      vplsEntry.acs = vplsEntry_set.acs;

      const resp = await this.setVplsByRpc(this.dut1.rpc, vplsEntry_set);

      if (resp.return_code === 0) {
        const vplsEntries = await this.getAllVplsFromDut(this.dut1.cli);

        const vplsEntry_got = vplsEntries.filter(vplsEntry_got =>
          vplsEntry_got.compareTo(vplsEntry)
        );

        expect(vplsEntry_got.length).toEqual(1);
      } else {
        expect(resp.return_code).toEqual(0);
      }
    } finally {
      //
      await this.delVplsByDut(this.dut1.cli, vplsEntry);
    }
  }

  @Test(
    "test set a same ac interface but with different ac type vlan vlaue in a vpls which has an ac before setting",
    300000
  )
  private async testSetAc_update_02() {
    const vplsEntry = new VplsEntry(new CommonKey("vpls_dut"), 1000);

    const defAc = new DefAc();
    defAc.inter = this.port_ac_08;
    defAc.vlan = 100;
    defAc.cos = 4;

    vplsEntry.acs.push(defAc);

    try {
      await this.addVplsByDut(this.dut1.cli, vplsEntry);

      const vplsEntry_set = new VplsEntry(vplsEntry.key, vplsEntry.vplsId);

      const defAc_set = new DefAc();
      defAc_set.inter = this.port_ac_08;
      defAc_set.vlan = 200;
      defAc_set.cos = 5;

      vplsEntry_set.acs.push(defAc_set);

      vplsEntry.acs = vplsEntry_set.acs;

      const resp = await this.setVplsByRpc(this.dut1.rpc, vplsEntry_set);

      if (resp.return_code === 0) {
        const vplsEntries = await this.getAllVplsFromDut(this.dut1.cli);

        const vplsEntry_got = vplsEntries.filter(vplsEntry_got =>
          vplsEntry_got.compareTo(vplsEntry)
        );

        expect(vplsEntry_got.length).toEqual(1);
      } else {
        expect(resp.return_code).toEqual(0);
      }
    } finally {
      //
      await this.delVplsByDut(this.dut1.cli, vplsEntry);
    }
  }

  @Test(
    "test set a same ac interface but with different ac type [vlan etherType]",
    300000
  )
  private async testSetAc_update_03() {
    const vplsEntry = new VplsEntry(new CommonKey("vpls_dut"), 1000);

    const defAc = new DefAc();
    defAc.inter = this.port_ac_08;
    defAc.vlan = 100;
    defAc.cos = 4;

    vplsEntry.acs.push(defAc);

    try {
      await this.addVplsByDut(this.dut1.cli, vplsEntry);

      const vplsEntry_set = new VplsEntry(vplsEntry.key, vplsEntry.vplsId);

      const defAc_set = new DefAc();
      defAc_set.inter = this.port_ac_08;
      defAc_set.cos = 5;

      vplsEntry_set.acs.push(defAc_set);

      vplsEntry.acs = vplsEntry_set.acs;

      const resp = await this.setVplsByRpc(this.dut1.rpc, vplsEntry_set);

      if (resp.return_code === 0) {
        const vplsEntries = await this.getAllVplsFromDut(this.dut1.cli);

        const vplsEntry_got = vplsEntries.filter(vplsEntry_got =>
          vplsEntry_got.compareTo(vplsEntry)
        );

        expect(vplsEntry_got.length).toEqual(1);
      } else {
        expect(resp.return_code).toEqual(0);
      }
    } finally {
      //
      // await this.delVplsByDut(this.dut1.cli, vplsEntry);
    }
  }

  @Test(
    "test set a tbltppeer in a vpls which has no tbltppeer before setting",
    300000
  )
  private async testSetTppeer_add() {
    const vplsEntry = new VplsEntry(new CommonKey("vpls_dut"), 1000);

    const vplsUtil = await this.addPwpeForTblTpPeer(this.dut1);
    if (vplsUtil !== null) {
      try {
        await this.addVplsByDut(this.dut1.cli, vplsEntry);

        const vplsEntry_set = new VplsEntry(vplsEntry.key, vplsEntry.vplsId);

        const tppeer = new TblTpPeer("tppeer_dut");
        tppeer.workPwpe = vplsUtil.pwpeEntries[0].key.name;

        vplsEntry_set.tppeers.push(tppeer);

        vplsEntry.tppeers = vplsEntry_set.tppeers;

        // peer
        const peer = new DefPeer();
        peer.pw = vplsUtil.pwpeEntries[0].key.name;
        peer.tunnelGroup = vplsUtil.pwpeEntries[0].tunnel;
        peer.inlabel = vplsUtil.pwpeEntries[0].inlabel;
        peer.outlabel = vplsUtil.pwpeEntries[0].outlabel;

        vplsEntry.peers.push(peer);

        const resp = await this.setVplsByRpc(this.dut1.rpc, vplsEntry);

        if (resp.return_code === 0) {
          const vplsEntries = await this.getAllVplsFromDut(this.dut1.cli);

          const vplsEntry_got = vplsEntries.filter(vplsEntry_got =>
            vplsEntry_got.compareTo(vplsEntry)
          );

          expect(vplsEntry_got.length).toEqual(1);
        } else {
          expect(resp.return_code).toEqual(0);
        }
      } finally {
        //
        await this.delVplsByDut(this.dut1.cli, vplsEntry);
        await this.delPwpeForTblTpPeer(this.dut1, vplsUtil);
      }
    } else {
      expect(vplsUtil).not.toBeNull();
    }
  }

  @Test(
    "test set a tbltppeer in a vpls which has a tbltppeer already before setting [different name different pwpe]",
    300000
  )
  private async testSetTppeer_update() {
    const vplsEntry = new VplsEntry(new CommonKey("vpls_dut"), 1000);

    const vplsUtil = await this.addPwpeForTblTpPeer(this.dut1);

    if (vplsUtil !== null) {
      // tbltppeer
      const tppeer = new TblTpPeer("tppeer_dut");
      tppeer.workPwpe = vplsUtil.pwpeEntries[0].key.name;

      vplsEntry.tppeers.push(tppeer);

      // peer
      const peer = new DefPeer();
      peer.pw = vplsUtil.pwpeEntries[0].key.name;
      peer.tunnelGroup = vplsUtil.pwpeEntries[0].tunnel;
      peer.inlabel = vplsUtil.pwpeEntries[0].inlabel;
      peer.outlabel = vplsUtil.pwpeEntries[0].outlabel;

      vplsEntry.peers.push(peer);

      try {
        await this.addVplsByDut(this.dut1.cli, vplsEntry);

        const vplsEntry_set = new VplsEntry(vplsEntry.key, vplsEntry.vplsId);

        // tbltppeer_set
        const tppeer_set = new TblTpPeer("tppeer_dut_set");
        tppeer_set.workPwpe = vplsUtil.pwpeEntries[1].key.name;

        vplsEntry_set.tppeers.push(tppeer_set);

        vplsEntry.tppeers = vplsEntry_set.tppeers;

        // peer_set
        const peer_set = new DefPeer();
        peer_set.pw = vplsUtil.pwpeEntries[1].key.name;
        peer_set.tunnelGroup = vplsUtil.pwpeEntries[1].tunnel;
        peer_set.inlabel = vplsUtil.pwpeEntries[1].inlabel;
        peer_set.outlabel = vplsUtil.pwpeEntries[1].outlabel;

        vplsEntry_set.peers.push(peer_set);

        vplsEntry.peers = vplsEntry_set.peers;

        const resp = await this.setVplsByRpc(this.dut1.rpc, vplsEntry);

        if (resp.return_code === 0) {
          const vplsEntries = await this.getAllVplsFromDut(this.dut1.cli);

          const vplsEntry_got = vplsEntries.filter(vplsEntry_got =>
            vplsEntry_got.compareTo(vplsEntry)
          );

          expect(vplsEntry_got.length).toEqual(1);
        } else {
          expect(resp.return_code).toEqual(0);
        }
      } finally {
        //
        await this.delVplsByDut(this.dut1.cli, vplsEntry);
        await this.delPwpeForTblTpPeer(this.dut1, vplsUtil);
      }
    } else {
      expect(vplsUtil).not.toBeNull();
    }
  }

  @Test(
    "test set a tbltppeer in a vpls which has a tbltppeer but has no pwpe [same name different pwpe]",
    300000
  )
  private async testSetTppeer_update_02() {
    const vplsEntry = new VplsEntry(new CommonKey("vpls_dut"), 1000);
    const tppeer = new TblTpPeer("tppeer_dut");
    vplsEntry.tppeers.push(tppeer);

    const vplsUtil = await this.addPwpeForTblTpPeer(this.dut1);

    if (vplsUtil !== null) {
      try {
        await this.addVplsByDut(this.dut1.cli, vplsEntry);

        const vplsEntry_set = new VplsEntry(vplsEntry.key, vplsEntry.vplsId);

        const tppeer_set = new TblTpPeer(tppeer.name);
        tppeer_set.workPwpe = vplsUtil.pwpeEntries[0].key.name;

        vplsEntry_set.tppeers.push(tppeer_set);

        vplsEntry.tppeers = vplsEntry_set.tppeers;

        // peer
        const peer = new DefPeer();
        peer.pw = vplsUtil.pwpeEntries[0].key.name;
        peer.tunnelGroup = vplsUtil.pwpeEntries[0].tunnel;
        peer.inlabel = vplsUtil.pwpeEntries[0].inlabel;
        peer.outlabel = vplsUtil.pwpeEntries[0].outlabel;

        vplsEntry.peers.push(peer);

        const resp = await this.setVplsByRpc(this.dut1.rpc, vplsEntry_set);
        if (resp.return_code === 0) {
          const vplsEntries = await this.getAllVplsFromDut(this.dut1.cli);

          const vplsEntry_got = vplsEntries.filter(vplsEntry_got =>
            vplsEntry_got.compareTo(vplsEntry)
          );

          expect(vplsEntry_got.length).toEqual(1);
        } else {
          expect(resp.return_code).toEqual(0);
        }
      } finally {
        await this.delVplsByDut(this.dut1.cli, vplsEntry);
        await this.delPwpeForTblTpPeer(this.dut1, vplsUtil);
      }
    } else {
      expect(vplsUtil).not.toBeNull();
    }
  }

  // -------------------------------------------------------------------
  // rpc get all vpls
  private async getAllVplsFromRpc(
    rpc: RpcClient,
    range: object
  ): Promise<Array<VplsEntry>> {
    const resp = await rpc.vpls.getall(range);
    console.log("resp: ", JSON.stringify(resp));
    if (resp.return_code === 0) {
      return resp.data.map(vpls => {
        const vplsEntry = new VplsEntry(new CommonKey(vpls.key.name), 0);
        const acs = vpls.acs.map(ac => {
          const acEntry = new DefAc();
          acEntry.inter = ac.interface;
          acEntry.vlan = ac.vlan;
          acEntry.fc = ac.filter_class;
          acEntry.type = ac.type;
          acEntry.cos = ac.cos;
          acEntry.rxOctets = ac.rx_octets;
          acEntry.rxPkts = ac.rx_pkts;
          acEntry.txOctets = ac.tx_octets;
          acEntry.txPkts = ac.tx_pkts;
          acEntry.sp = ac.service_policy;
          acEntry.acId = ac.ac_id;
          return acEntry;
        });

        const tblTppeers = vpls.tppeers.map(tppeer => {
          const tblTppeerEntry = new TblTpPeer(tppeer.name);
          tblTppeerEntry.workPwpe = tppeer.working_pwpe;
          return tblTppeerEntry;
        });

        const peers = vpls.peers.map(peer => {
          const peerEntry = new DefPeer();
          peerEntry.pw = peer.pw;
          peerEntry.tunnelGroup = peer.tunnel_group;
          peerEntry.lsp = peer.lsp;
          peerEntry.inlabel = peer.inlabel;
          peerEntry.outlabel = peer.outlabel;
          peerEntry.pwInter = peer.pw_interface;
          peerEntry.peerStatus = peer.peer_status;

          return peerEntry;
        });

        vplsEntry.acs = acs;
        vplsEntry.tppeers = tblTppeers;
        vplsEntry.peers = peers;
        return vplsEntry;
      });
    } else {
      return [];
    }
  }

  // rpc add vpls
  private async addVplsByRpc(rpc: RpcClient, vpls: VplsEntry) {
    let acs = vpls.acs.map(ac => {
      if (ac.vlan !== 0 && ac.fc === "") {
        if (ac.cos === 0) {
          return { interface: ac.inter, vlan: ac.vlan };
        } else {
          return { interface: ac.inter, vlan: ac.vlan, cos: ac.cos };
        }
      }
      if (ac.fc !== "" && ac.vlan === 0) {
        if (ac.cos === 0) {
          return { interface: ac.inter, filter_class: ac.fc };
        } else {
          return { interface: ac.inter, filter_class: ac.fc, cos: ac.cos };
        }
      }
      if (ac.cos === 0) {
        return { interface: ac.inter };
      } else {
        return { interface: ac.inter, cos: ac.cos };
      }
    });

    let tppeers = vpls.tppeers.map(tppeer => {
      const result = {
        name: tppeer.name,
        working_pwpe: tppeer.workPwpe
      };
      if (result.working_pwpe === "") delete result.working_pwpe;
      return result;
    });

    const param = {
      key: vpls.key.getKey(),
      acs: acs,
      tppeers: tppeers
    };
    if (param.acs.length === 0) delete param.acs;
    if (param.tppeers.length === 0) delete param.tppeers;
    return await rpc.vpls.add(param);
  }

  // rpc del vpls
  private async delVplsByRpc(rpc: RpcClient, vpls: VplsEntry) {
    return await rpc.vpls.del({ key: vpls.key.getKey() });
  }

  private async setVplsByRpc(rpc: RpcClient, vpls: VplsEntry) {
    let acs = vpls.acs.map(ac => {
      if (ac.vlan !== 0 && ac.fc === "") {
        if (ac.cos === 0) {
          return { interface: ac.inter, vlan: ac.vlan };
        } else {
          return { interface: ac.inter, vlan: ac.vlan, cos: ac.cos };
        }
      }
      if (ac.fc !== "" && ac.vlan === 0) {
        if (ac.cos === 0) {
          return { interface: ac.inter, filter_class: ac.fc };
        } else {
          return { interface: ac.inter, filter_class: ac.fc, cos: ac.cos };
        }
      }
      if (ac.cos === 0) {
        return { interface: ac.inter };
      } else {
        return { interface: ac.inter, cos: ac.cos };
      }
    });

    let tppeers = vpls.tppeers.map(tppeer => {
      const result = {
        name: tppeer.name,
        working_pwpe: tppeer.workPwpe
      };
      if (result.working_pwpe === "") delete result.working_pwpe;
      return result;
    });

    const param = {
      key: vpls.key.getKey(),
      acs: acs,
      tppeers: tppeers
    };
    if (param.acs.length === 0) delete param.acs;
    if (param.tppeers.length === 0) delete param.tppeers;
    return await rpc.vpls.set(param);
  }

  // dut del vpls
  private async delVplsByDut(dut: Dut, vpls: VplsEntry) {
    await dut.exec`
      > configure terminal
      > no mpls vpls ${vpls.key.name}
      > end
    `;
    await this.delAcs(dut, vpls);
  }

  // dut del ac
  private async delAcs(dut: Dut, vpls: VplsEntry) {
    const acs = vpls.acs;
    for (let i = 0; i < acs.length; i++) {
      const acEntry = acs[i];

      await dut.exec`
        > configure terminal
        > interface ${acEntry.inter}
      `;

      if (acEntry.fc !== "" && acEntry.vlan === 0) {
        await dut.exec`
          > no mpls-vpls ${vpls.key.name} filter-class ${acEntry.fc}
          > switchport mode access
          > end
        `;
      } else {
        await dut.exec`
          > no mpls-vpls ${vpls.key.name}
          > switchport mode access
          > end
        `;
      }
    }
  }

  // dut get all vpls
  private async getAllVplsFromDut(dut: Dut): Promise<Array<VplsEntry>> {
    const output = await dut.exec`
      > show run
    `;
    let output_arr = output
      .replace(/\r\n/g, " ")
      .replace(/\u001b\[\d*\w/g, "")
      .split("!");

    let output_arr_format = output_arr.map(ele => {
      return ele
        .replace(/[\r\n]+/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
    });

    let peersMap = output_arr_format
      .filter(ele => {
        return /mpls\spw\st-pe.*?\s*/g.test(ele);
      })
      .map(pwpe => {
        return pwpe.split(/\s/g);
      })
      .map(pwpe_arr => {
        if (pwpe_arr[2] === "t-pe") {
          const peer = new DefPeer();
          for (let i = 2; i < pwpe_arr.length; i++) {
            switch (pwpe_arr[i]) {
              case "t-pe":
                peer.pw = pwpe_arr[++i];
                break;
              case "inlabel":
                peer.inlabel = parseInt(pwpe_arr[++i]);
                break;
              case "outlabel":
                peer.outlabel = parseInt(pwpe_arr[++i]);
                break;
              case "tunnel":
                peer.tunnelGroup = pwpe_arr[++i];
                break;
            }
          }
          return peer;
        }
      })
      .filter(peerEntry => peerEntry !== null)
      .reduce((pre, cur) => {
        pre[cur.pw] = cur;
        return pre;
      }, {});

    let acsMap = output_arr_format
      .filter(ele => {
        return /interface\seth-0.*?\s*/g.test(ele);
      })
      .map(ac => {
        return ac.split(/\s/g);
      })
      .map(ac_arr => {
        let start = 0;
        let acEntry = new DefAc();
        for (let i = 0; i < ac_arr.length; i++) {
          switch (ac_arr[i]) {
            case "interface":
              acEntry.inter = ac_arr[++i];
              break;
            case "mpls-vpls":
              start = i;
              acEntry.vpws = ac_arr[++i];
              break;
            case "vlan":
              acEntry.vlan = parseInt(ac_arr[++i]);
              break;
            case "filter-class":
              acEntry.fc = ac_arr[++i];
              break;
            case "cos":
              acEntry.cos = parseInt(ac_arr[++i]) + 1;
              break;
          }
        }
        return start === 0 ? null : acEntry;
      })
      .filter(acEntry => acEntry !== null)
      .reduce((pre, cur) => {
        pre[cur.vpws] = pre[cur.vpws] ? pre[cur.vpws] : [];
        pre[cur.vpws].push(cur);
        return pre;
      }, {});

    let vplsEntries = output_arr_format
      .filter(ele => {
        return /mpls\svpls.*?\s*/g.test(ele);
      })
      .map(vpls => {
        return vpls.split(/\s/g);
      })
      .map(vpls_arr => {
        if (vpls_arr[1] === "vpls") {
          const vplsEntry = new VplsEntry(new CommonKey(vpls_arr[2]), 0);
          let tblTppeer = new TblTpPeer("");
          for (let i = 2; i < vpls_arr.length; i++) {
            if (vpls_arr[i] === "tp-peer") {
              tblTppeer = new TblTpPeer(vpls_arr[++i]);
            }

            if (vpls_arr[i + 1] === "create") {
              i++;
            }

            if (vpls_arr[++i] === "primary" && tblTppeer.name !== "") {
              tblTppeer.workPwpe = vpls_arr[++i];
            }

            if (tblTppeer.name !== "") {
              vplsEntry.tppeers.push(tblTppeer);
            }

            if (vpls_arr[i + 1] === "exit-tp-peer") {
              i++;
            }
          }
          return vplsEntry;
        }
      })
      .filter(vplsEntry => vplsEntry !== null)
      .map(vpls => {
        vpls.acs = acsMap[vpls.key.name] ? acsMap[vpls.key.name] : [];
        vpls.peers = vpls.tppeers
          .map(tppeers => {
            return tppeers.workPwpe ? peersMap[tppeers.workPwpe] : null;
          })
          .filter(peer => peer !== null);
        return vpls;
      });
    return vplsEntries;
  }

  //dut add vpls
  private async addVplsByDut(dut: Dut, vplsEntry: VplsEntry) {
    await dut.exec`
      > configure terminal
      > mpls vpls ${vplsEntry.key.name} ${vplsEntry.vplsId}
    `;
    if (vplsEntry.tppeers.length > 0) {
      for (let tppeer of vplsEntry.tppeers) {
        if (tppeer.workPwpe !== "") {
          await dut.exec`
            > tp-peer ${tppeer.name} create
            > primary ${tppeer.workPwpe}
            > exit
          `;
        } else {
          await dut.exec`
            > tp-peer ${tppeer.name} create
            > exit
          `;
        }
      }
    }
    await dut.exec`
      > end
    `;

    // 配置 ac
    for (let i = 0; i < vplsEntry.acs.length; i++) {
      const acEntry = vplsEntry.acs[i];
      if (vplsEntry.acs.length !== 0) {
        await dut.exec`
          > configure terminal
          > interface ${acEntry.inter}
        `;
        if (acEntry.vlan !== 0 && acEntry.fc === "") {
          await dut.exec`
            > switchport mode trunk
            > mpls-vpls ${vplsEntry.key.name} vlan ${acEntry.vlan} ${
            acEntry.cos !== 0 ? "cos " + acEntry.cos : ""
          }
          `;
        }
        if (acEntry.fc !== "" && acEntry.vlan === 0) {
          await dut.exec`
            > mpls-vpls ${vplsEntry.key.name} filter-class ${acEntry.fc} ${
            acEntry.cos !== 0 ? "cos " + acEntry.cos : ""
          }
          `;
        }
        if (acEntry.fc === "" && acEntry.vlan === 0) {
          await dut.exec`
            > mpls-vpls ${vplsEntry.key.name} ethernet ${
            acEntry.cos !== 0 ? "cos " + acEntry.cos : ""
          }
          `;
        }
        await dut.exec`
          > end
        `;
      }
    }
  }

  // --------------------------------------------------------------------
  private async addPwpeForTblTpPeer(idut: IDut): Promise<VplsUtil> {
    const cli = idut.cli;
    const ports = idut.port;

    const port_09 = ports[8];
    const port_11 = ports[10];
    const port_13 = ports[12];
    const port_15 = ports[14];
    const port_17 = ports[16];
    const port_19 = ports[18];

    const ip_port_09 = "9.9.9.9";
    const ip_port_11 = "11.11.11.11";
    const ip_port_13 = "13.13.13.13";
    const ip_port_15 = "15.15.15.15";
    const ip_port_17 = "17.17.17.17";
    const ip_port_19 = "19.19.19.19";

    const ip_port_09_num = await ipToNumber("9.9.9.2");
    const ip_port_11_num = await ipToNumber("11.11.11.2");
    const ip_port_13_num = await ipToNumber("13.13.13.2");
    const ip_port_15_num = await ipToNumber("15.15.15.2");
    const ip_port_17_num = await ipToNumber("17.17.17.2");
    const ip_port_19_num = await ipToNumber("19.19.19.2");

    // lsp LsppeEntry
    const lsppeEntry_09 = new LsppeEntry(new CommonKey("lsp09"));
    const lsppeEntry_11 = new LsppeEntry(new CommonKey("lsp11"));
    const lsppeEntry_13 = new LsppeEntry(new CommonKey("lsp13"));
    const lsppeEntry_15 = new LsppeEntry(new CommonKey("lsp15"));
    const lsppeEntry_17 = new LsppeEntry(new CommonKey("lsp17"));
    const lsppeEntry_19 = new LsppeEntry(new CommonKey("lsp19"));

    lsppeEntry_09.inLabel = 2009;
    lsppeEntry_09.outLabel = 2009;
    lsppeEntry_09.nexthopIp = ip_port_09_num;
    lsppeEntry_09.weight = 0;

    lsppeEntry_11.inLabel = 2011;
    lsppeEntry_11.outLabel = 2011;
    lsppeEntry_11.nexthopIp = ip_port_11_num;
    lsppeEntry_11.weight = 3;

    lsppeEntry_13.inLabel = 2013;
    lsppeEntry_13.outLabel = 2013;
    lsppeEntry_13.nexthopIp = ip_port_13_num;
    lsppeEntry_13.weight = 4;

    lsppeEntry_15.inLabel = 2015;
    lsppeEntry_15.outLabel = 2015;
    lsppeEntry_15.nexthopIp = ip_port_15_num;
    lsppeEntry_15.weight = 0;

    lsppeEntry_17.inLabel = 2017;
    lsppeEntry_17.outLabel = 2017;
    lsppeEntry_17.nexthopIp = ip_port_17_num;
    lsppeEntry_17.weight = 3;

    lsppeEntry_19.inLabel = 2019;
    lsppeEntry_19.outLabel = 2019;
    lsppeEntry_19.nexthopIp = ip_port_19_num;
    lsppeEntry_19.weight = 2;

    // tunnel TunnelEntry
    const tunnelEntry_01 = new TunnelEntry(new CommonKey("tunnel_dut_01"));
    tunnelEntry_01.workLsp = lsppeEntry_09.key.name;
    const tunnel_01_lsp2 = new DefProtectLsp(lsppeEntry_11.key.name);
    const tunnel_01_lsp3 = new DefProtectLsp(lsppeEntry_13.key.name);
    tunnel_01_lsp2.weight = 3;
    tunnel_01_lsp3.weight = 4;
    tunnelEntry_01.protectLsp.push(tunnel_01_lsp2);
    tunnelEntry_01.protectLsp.push(tunnel_01_lsp3);

    const tunnelEntry_02 = new TunnelEntry(new CommonKey("tunnel_dut_02"));
    tunnelEntry_02.workLsp = lsppeEntry_15.key.name;
    const tunnel_02_lsp2 = new DefProtectLsp(lsppeEntry_17.key.name);
    const tunnel_02_lsp3 = new DefProtectLsp(lsppeEntry_19.key.name);
    tunnel_02_lsp2.weight = 3;
    tunnel_02_lsp3.weight = 2;
    tunnelEntry_02.protectLsp.push(tunnel_02_lsp2);
    tunnelEntry_02.protectLsp.push(tunnel_02_lsp3);

    // pwpe PwpeEntry
    const pwpeEntry_01 = new PwpeEntry(new CommonKey("pwpe_dut_01"));
    pwpeEntry_01.inlabel = 3001;
    pwpeEntry_01.outlabel = 3001;
    pwpeEntry_01.tunnel = tunnelEntry_01.key.name;

    const pwpeEntry_02 = new PwpeEntry(new CommonKey("pwpe_dut_02"));
    pwpeEntry_02.inlabel = 3002;
    pwpeEntry_02.outlabel = 3002;
    pwpeEntry_02.tunnel = tunnelEntry_02.key.name;

    let hasError = false;

    const vplsUtil = new VplsUtil();

    vplsUtil.ports.push(port_09);
    vplsUtil.ports.push(port_11);
    vplsUtil.ports.push(port_13);
    vplsUtil.ports.push(port_15);
    vplsUtil.ports.push(port_17);
    vplsUtil.ports.push(port_19);

    vplsUtil.lsppeEntries.push(lsppeEntry_09);
    vplsUtil.lsppeEntries.push(lsppeEntry_11);
    vplsUtil.lsppeEntries.push(lsppeEntry_13);
    vplsUtil.lsppeEntries.push(lsppeEntry_15);
    vplsUtil.lsppeEntries.push(lsppeEntry_17);
    vplsUtil.lsppeEntries.push(lsppeEntry_19);

    vplsUtil.tunnelEntries.push(tunnelEntry_01);
    vplsUtil.tunnelEntries.push(tunnelEntry_02);

    vplsUtil.pwpeEntries.push(pwpeEntry_01);
    vplsUtil.pwpeEntries.push(pwpeEntry_02);

    try {
      await this.enablePortMpls(cli, port_09, ip_port_09);
      await this.enablePortMpls(cli, port_11, ip_port_11);
      await this.enablePortMpls(cli, port_13, ip_port_13);
      await this.enablePortMpls(cli, port_15, ip_port_15);
      await this.enablePortMpls(cli, port_17, ip_port_17);
      await this.enablePortMpls(cli, port_19, ip_port_19);

      await this.addLspByDut(cli, lsppeEntry_09);
      await this.addLspByDut(cli, lsppeEntry_11);
      await this.addLspByDut(cli, lsppeEntry_13);
      await this.addLspByDut(cli, lsppeEntry_15);
      await this.addLspByDut(cli, lsppeEntry_17);
      await this.addLspByDut(cli, lsppeEntry_19);

      await this.addTunnelByDut(cli, tunnelEntry_01);
      await this.addTunnelByDut(cli, tunnelEntry_02);

      await this.addPwpeByDut(cli, pwpeEntry_01);
      await this.addPwpeByDut(cli, pwpeEntry_02);
    } catch (e) {
      console.log("error: ", e.message);
      hasError = true;
    }
    return hasError ? null : vplsUtil;
  }

  private async delPwpeForTblTpPeer(idut: IDut, vpwsUtil: VplsUtil) {
    if (vpwsUtil !== null) {
      for (let pwpeEntry of vpwsUtil.pwpeEntries) {
        await this.delPwpeByDut(idut.cli, pwpeEntry);
      }
      for (let tunnelEntry of vpwsUtil.tunnelEntries) {
        await this.delTunnelByDut(idut.cli, tunnelEntry);
      }
      for (let lsppeEntry of vpwsUtil.lsppeEntries) {
        await this.delLsppeByDut(idut.cli, lsppeEntry);
      }
      for (let port of vpwsUtil.ports) {
        await this.disablePortMpls(idut.cli, port);
      }
    } else {
      console.log("there is no config vpwsUtil");
    }
  }
  // ---------------------------------------------------------------------

  // dut add pwpe
  private async addPwpeByDut(dut: Dut, pwpe: PwpeEntry) {
    await dut.exec`
      > configure terminal
      > mpls pw t-pe ${pwpe.key.name}
    `;
    if (pwpe.inlabel !== 1048576) {
      await dut.exec`
        > inlabel ${pwpe.inlabel} outlabel ${pwpe.outlabel} mode raw tunnel ${pwpe.tunnel}
      `;
    }
    await dut.exec`
      > end
    `;
  }

  // dut del pwpe
  private async delPwpeByDut(dut: Dut, pwpe: PwpeEntry) {
    await dut.exec`
      > configure terminal
      > no mpls pw t-pe ${pwpe.key.name}
      > end
    `;
  }

  // dut add lsppe
  private async addLspByDut(dut: Dut, lspEntry: LsppeEntry) {
    const ip = await numberToIp(lspEntry.nexthopIp);
    await dut.exec`
      > configure terminal
      > mpls lsp-pe ${lspEntry.key.name}
      > inlabel ${lspEntry.inLabel}
      > outlabel ${lspEntry.outLabel} ${ip}
      > weight ${lspEntry.weight}
      > bhh auto
      > end
    `;
  }

  // dut del lsppe
  private async delLsppeByDut(dut: Dut, lsppe: LsppeEntry) {
    await dut.exec`
      > configure terminal
      > no mpls lsp-pe ${lsppe.key.name}
      > end
    `;
  }

  // dut add tunnel
  private async addTunnelByDut(dut: Dut, tunnel: TunnelEntry) {
    const protect_lsp = tunnel.protectLsp;
    const work_lsp = tunnel.workLsp;
    await dut.exec`
      > configure terminal
      > mpls n21tunnel ${tunnel.key.name} aps
    `;
    if (work_lsp) {
      await dut.exec`
        > lsp1 ${work_lsp}
      `;

      for (let i = 0; i < protect_lsp.length; i++) {
        await dut.exec`
          > lsp${i + 2} ${protect_lsp[i].name}
        `;
      }
    }
    await dut.exec`> end`;
  }

  // dut del tunnel
  private async delTunnelByDut(dut: Dut, tunnel: TunnelEntry) {
    await dut.exec`
      > configure terminal
      > no mpls n21tunnel ${tunnel.key.name}
      > end
    `;
  }

  // dut add filter class
  private async addFCByDut(dut: Dut, fc: FilterClassEntry) {
    const srcIp =
      fc.srcIp !== 0 && fc.srcIpMaskLen !== 0
        ? (await numberToIp(fc.srcIp)) + `/${fc.srcIpMaskLen}`
        : "";

    const dstIp =
      fc.dstIp !== 0 && fc.dstIpMaskLen !== 0
        ? (await numberToIp(fc.dstIp)) + `/${fc.dstIpMaskLen}`
        : "";

    let cmd = "";
    if (fc.name !== "") cmd += `mpls filter-class ${fc.name}`;
    if (fc.srcMac !== "") cmd += ` src-mac ${this.formatMacParm(fc.srcMac)}`;
    if (fc.dstMac !== "") cmd += ` dst-mac ${this.formatMacParm(fc.dstMac)}`;
    if (fc.vlan !== 0) cmd += ` vlan ${fc.vlan}`;
    if (fc.etherType !== 0) cmd += ` ether-type ${fc.etherType}`;
    if (fc.cos !== 0) cmd += ` cos ${fc.cos - 1}`;
    if (srcIp !== "") cmd += ` src-ip ${srcIp}`;
    if (dstIp !== "") cmd += ` dst-ip ${dstIp}`;
    if (fc.protocol !== 0) cmd += ` protocol ${fc.protocol}`;
    if (fc.dscp !== 0) cmd += ` dscp ${fc.dscp - 1}`;
    if (fc.srcPort !== 0) cmd += ` src-port ${fc.srcPort}`;
    if (fc.dstPort !== 0) cmd += ` dst-port ${fc.dstPort}`;

    await dut.exec`
      > configure terminal
      > ${cmd}
      > end
    `;
  }

  // dut delete filter class
  private async delFCByDut(dut: Dut, fc: FilterClassEntry) {
    await dut.exec`
      > configure terminal
      > no mpls filter-class ${fc.name}
      > end
    `;
  }

  // dut enable port mpls
  private async enablePortMpls(dut: Dut, port: string, ip: string) {
    const ipMask = ip + "/24";
    await dut.exec`
      > configure terminal
      > interface ${port}
      > no switchport
      > label-switching
      > ip address ${ipMask}
      > end
    `;
  }

  // dut disable port mpls
  private async disablePortMpls(dut: Dut, port: string) {
    await dut.exec`
      > configure terminal
      > interface ${port}
      > switchport
      > end
    `;
  }

  private formatMacParm(mac: string): string {
    if (mac.split(/:/).length === 6) {
      return mac.split(/:/).reduce((pre, cur) => {
        if (pre.length === 2) {
          return pre + cur + ".";
        } else if (pre.length === 5) {
          return pre + cur;
        } else if (pre.length === 7) {
          return pre + cur + ".";
        } else if (pre.length === 10) {
          return pre + cur;
        } else if (pre.length === 12) {
          return pre + cur;
        } else {
          return cur;
        }
      });
    }
  }
}
