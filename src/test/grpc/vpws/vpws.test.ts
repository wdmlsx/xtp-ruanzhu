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
import { Dut } from "@xtp/telnet";
import { RpcClient } from "@xtp/grpc";
import { VpwsEntry } from "../mpls/VpwsEntry";
import { PwpeEntry } from "../mpls/PwpeEntry";
import { TunnelEntry } from "../mpls/TunnelEntry";
import { LsppeEntry } from "../mpls/LsppeEntry";
import { ipToNumber, numberToIp } from "../../../utils";
import { CommonKey } from "../mpls/CommonKey";
import { DefPeer } from "../mpls/DefPeer";
import { DefAc } from "../mpls/DefAc";
import { DefProtectLsp } from "../mpls/DefProtectLsp";
import { VpwsUtil } from "./VpwsUtil";
import { IDut } from "../../../topos/definitions";
import { FilterClassEntry } from "../mpls/FilterClassEntry";

/*
 * @Describe注解用于描述该测试用例所测试的功能
 * 该文字描述会在脚本执行完毕后在终端输出，也会记录到测试报告中，方便用户查看
 * */
@Describe("test system")
class SystemTest {
  /*
  * @InjectTopo 注解用于给该测试类注入拓扑
  * 初始化该类时注入虚拟拓扑
  * */
  @InjectTopo
  private readonly topo: DoubleDevice;

  private dut1: IDut;
  private dut2: IDut;

  private port_ac_08: string;
  private port_ac_10: string;
  private port_ac_12: string;

  /*
   * 从拓扑中获取设备并进行链接
   * 每个测试例被执行前都将执行该方法，链接设备
   * @BeforeEach　注解会在每一个　@Test注解的测试方法执行前运行
   * */
  @BeforeEach
  private async beforeEach() {
    await this.dut1.cli.connect();
    // await this.dut2.cli.connect();
  }

  /*
   * 每个测试用例跑完都断开设备连接
   * 因为每台设备允许的telnet最多链接数是有限的
   * @AfterEach　注解会在每一个　@Test注解的测试方法执行后执行
   * */
  @AfterEach
  private async afterEach() {
    await this.dut1.cli.end();
    // await this.dut2.cli.end();
  }

  /*
   * @BeforeAll注解会在所有@Test注解的测试方法前运行，
   * 只运行一次
   * 用于初始化一些数据
   * */
  @BeforeAll
  private async init() {
    this.dut1 = this.topo.dut1;
    this.dut2 = this.topo.dut2;

    this.port_ac_08 = this.dut1.port[7];
    this.port_ac_10 = this.dut1.port[9];
    this.port_ac_12 = this.dut1.port[11];
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test add vpws with given key of all numbel", 30000)
  private async testAddVpws_number() {
    const vpwsEntry = new VpwsEntry(new CommonKey("123456"));
    let hasError = false;
    try {
      const resp = await this.addVpwsByRpc(this.dut1.rpc, vpwsEntry);
      if (resp.return_code === 0) {
        const vpwsEntries = await this.getallVpwsFromDut(this.dut1.cli);
        const vpwsEntry_got = vpwsEntries.filter(vpws_got =>
          vpws_got.compareTo(vpwsEntry)
        );
        expect(vpwsEntry_got.length).toEqual(1);
      } else {
        expect(resp.return_code).toEqual(0);
      }
    } catch (e) {
      hasError = true;
    } finally {
      if (!hasError) {
        await this.delVpwsByDut(this.dut1.cli, vpwsEntry);
      }
    }
    expect(hasError).toBeFalsy();
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test add vpws with given key of string", 30000)
  private async testAddVpws_string() {
    const vpwsEntry = new VpwsEntry(new CommonKey("vpws_rpc"));
    try {
      const resp = await this.addVpwsByRpc(this.dut1.rpc, vpwsEntry);
      if (resp.return_code === 0) {
        const vpwsEntries = await this.getallVpwsFromDut(this.dut1.cli);
        const vpwsEntry_got = vpwsEntries.filter(vpws_got =>
          vpws_got.compareTo(vpwsEntry)
        );
        expect(vpwsEntry_got.length).toEqual(1);
      } else {
        expect(resp.return_code).toEqual(0);
      }
    } finally {
      await this.delVpwsByDut(this.dut1.cli, vpwsEntry);
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test add vpws with an ac ethernet type and cos field", 30000)
  private async testAddVpwsWithAcEthernet() {
    const vpws_name = "vpws_dut";
    const vpws_key = new CommonKey(vpws_name);
    const vpwsEntry = new VpwsEntry(vpws_key);

    const defAc = new DefAc();
    defAc.inter = this.port_ac_08;
    defAc.cos = 6;
    vpwsEntry.acs.push(defAc);

    try {
      const resp = await this.addVpwsByRpc(this.dut1.rpc, vpwsEntry);
      if (resp.return_code === 0) {
        const vpwsEntries = await this.getallVpwsFromDut(this.dut1.cli);
        const vpws_got = vpwsEntries.filter(vpwsEntry_got =>
          vpwsEntry_got.compareTo(vpwsEntry)
        ).length;
        expect(vpws_got).toEqual(1);
      } else {
        expect(resp.return_code).toEqual(0);
      }
    } finally {
      await this.delVpwsByDut(this.dut1.cli, vpwsEntry);
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test add vpws with an ac filter-class type and cos field")
  private async testAddVpwsWithAcFilterClass() {
    const vpws_name = "vpws_dut";
    const vpws_key = new CommonKey(vpws_name);
    const vpwsEntry = new VpwsEntry(vpws_key);

    const fcEntry = new FilterClassEntry("fc_dut");
    fcEntry.cos = 5;

    const defAc = new DefAc();
    defAc.inter = this.port_ac_08;
    defAc.fc = fcEntry.name;
    defAc.cos = 6;
    defAc.vpws = vpwsEntry.key.name;

    vpwsEntry.acs.push(defAc);

    try {
      await this.addFCByDut(this.dut1.cli, fcEntry);

      const resp = await this.addVpwsByRpc(this.dut1.rpc, vpwsEntry);
      if (resp.return_code === 0) {
        const vpwsEntries = await this.getallVpwsFromDut(this.dut1.cli);
        const vpws_got = vpwsEntries.filter(vpwsEntry_got =>
          vpwsEntry_got.compareTo(vpwsEntry)
        ).length;
        expect(vpws_got).toEqual(1);
      } else {
        expect(resp.return_code).toEqual(0);
      }
    } finally {
      await this.delVpwsByDut(this.dut1.cli, vpwsEntry);
      await this.delFCByDut(this.dut1.cli, fcEntry);
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test add vpws with an ac vlan type and cos field")
  private async testAddVpwsWithAcVlan() {
    const vpws_name = "vpws_dut";
    const vpws_key = new CommonKey(vpws_name);
    const vpwsEntry = new VpwsEntry(vpws_key);

    const defAc = new DefAc();
    defAc.inter = this.port_ac_08;
    defAc.vlan = 100;
    defAc.cos = 6;

    vpwsEntry.acs.push(defAc);

    try {
      const resp = await this.addVpwsByRpc(this.dut1.rpc, vpwsEntry);
      if (resp.return_code === 0) {
        const vpwsEntries = await this.getallVpwsFromDut(this.dut1.cli);
        const vpws_got = vpwsEntries.filter(vpwsEntry_got =>
          vpwsEntry_got.compareTo(vpwsEntry)
        ).length;
        expect(vpws_got).toEqual(1);
      } else {
        expect(resp.return_code).toEqual(0);
      }
    } finally {
      await this.delVpwsByDut(this.dut1.cli, vpwsEntry);
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test add vpws with primary pwpe", 300000)
  private async testAddVpwsWithPrimaryPwpe() {
    const vpwsEntry = new VpwsEntry(new CommonKey("vpws_rpc"));

    const vpwsUtil = await this.addPwpeForVpws(this.dut1);
    try {
      if (vpwsUtil !== null) {
        const pwpeEntry = vpwsUtil.pwpeEntries[0];
        vpwsEntry.wokPwpe = pwpeEntry.key.name;

        const peer = new DefPeer();
        peer.pw = pwpeEntry.key.name;
        peer.inlabel = pwpeEntry.inlabel;
        peer.outlabel = pwpeEntry.outlabel;
        peer.tunnelGroup = pwpeEntry.tunnel;

        vpwsEntry.peer = peer;

        const resp = await this.addVpwsByRpc(this.dut1.rpc, vpwsEntry);
        if (resp.return_code === 0) {
          const vpwsEntries = await this.getallVpwsFromDut(this.dut1.cli);
          const vpws_got = vpwsEntries.filter(vpwsEntry_got =>
            vpwsEntry_got.compareTo(vpwsEntry)
          );
          expect(vpws_got.length).toEqual(1);
        } else {
          expect(resp.return_code).toEqual(0);
        }
      }
    } finally {
      await this.delVpwsByDut(this.dut1.cli, vpwsEntry);

      await this.delPwpeForVpws(this.dut1, vpwsUtil);
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test del vpws")
  private async testDelVpws() {
    const vpws_name = "vpws_dut";
    const vpws_key = new CommonKey(vpws_name);
    const vpwsEntry = new VpwsEntry(vpws_key);

    vpwsEntry.vpwsId = 1234;

    let hasError = false;
    try {
      await this.addVpwsByDut(this.dut1.cli, vpwsEntry);
      const resp = await this.delVpwsByRpc(this.dut1.rpc, vpwsEntry);
      if (resp.return_code === 0) {
        const vpwsEntries = await this.getallVpwsFromDut(this.dut1.cli);
        const vpws_got = vpwsEntries.filter(vpwsEntry_got =>
          vpwsEntry_got.compareTo(vpwsEntry)
        ).length;
        expect(vpws_got).toEqual(0);
      } else {
        expect(resp.return_code).toEqual(0);
      }
    } catch (e) {
      hasError = true;
    } finally {
      expect(hasError).toBeFalsy();
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test getall vpws", 300000)
  private async testGetAll() {
    const vpwsEntry_01 = new VpwsEntry(new CommonKey("vpws_dut_01"));
    vpwsEntry_01.vpwsId = 4321;

    const defAc_01 = new DefAc();
    defAc_01.inter = this.port_ac_08;
    vpwsEntry_01.acs.push(defAc_01);

    const vpwsEntry_02 = new VpwsEntry(new CommonKey("vpws_dut_02"));
    vpwsEntry_02.vpwsId = 1234;

    const defAc_02 = new DefAc();
    defAc_02.inter = this.port_ac_10;
    defAc_02.vlan = 100;
    vpwsEntry_02.acs.push(defAc_02);

    const vpwsEntry_03 = new VpwsEntry(new CommonKey("vpws_dut_03"));
    vpwsEntry_03.vpwsId = 2134;

    const vpwsUtil = await this.addPwpeForVpws(this.dut1);
    try {
      if (vpwsUtil !== null) {
        vpwsEntry_01.wokPwpe = vpwsUtil.pwpeEntries[0].key.name;

        const peer_01 = new DefPeer();
        peer_01.pw = vpwsUtil.pwpeEntries[0].key.name;
        peer_01.tunnelGroup = vpwsUtil.pwpeEntries[0].tunnel;
        peer_01.inlabel = vpwsUtil.pwpeEntries[0].inlabel;
        peer_01.outlabel = vpwsUtil.pwpeEntries[0].outlabel;
        vpwsEntry_01.peer = peer_01;

        vpwsEntry_03.wokPwpe = vpwsUtil.pwpeEntries[1].key.name;

        const peer_03 = new DefPeer();
        peer_03.pw = vpwsUtil.pwpeEntries[1].key.name;
        peer_03.tunnelGroup = vpwsUtil.pwpeEntries[1].tunnel;
        peer_03.inlabel = vpwsUtil.pwpeEntries[1].inlabel;
        peer_03.outlabel = vpwsUtil.pwpeEntries[1].outlabel;
        vpwsEntry_03.peer = peer_03;

        await this.addVpwsByDut(this.dut1.cli, vpwsEntry_01);
        await this.addVpwsByDut(this.dut1.cli, vpwsEntry_02);
        await this.addVpwsByDut(this.dut1.cli, vpwsEntry_03);

        const vpwsEntries = await this.getAllVpwsFromRpc(this.dut1.rpc, {
          start: 0,
          end: 0
        });

        if (vpwsEntries.length > 0) {
          const vpws_got = vpwsEntries.filter(vpwsEntry => {
            return (
              vpwsEntry.compareTo(vpwsEntry_01) ||
              vpwsEntry.compareTo(vpwsEntry_02) ||
              vpwsEntry.compareTo(vpwsEntry_03)
            );
          });
          expect(vpws_got.length).toEqual(3);
        } else {
          expect(vpwsEntries.length).not.toEqual(0);
        }
      }
    } finally {
      await this.delVpwsByDut(this.dut1.cli, vpwsEntry_01);
      await this.delVpwsByDut(this.dut1.cli, vpwsEntry_02);
      await this.delVpwsByDut(this.dut1.cli, vpwsEntry_03);
      //
      await this.delPwpeForVpws(this.dut1, vpwsUtil);
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test set vpws with ac field set action")
  private async testSetVpws() {
    const vpwsEntry = new VpwsEntry(new CommonKey("vpws_dut"));

    vpwsEntry.vpwsId = 1234;
    try {
      await this.addVpwsByDut(this.dut1.cli, vpwsEntry);

      const defAc = new DefAc();
      defAc.inter = this.port_ac_08;
      defAc.cos = 6;

      vpwsEntry.acs.push(defAc);

      const resp = await this.setVpwsByRpc(this.dut1.rpc, vpwsEntry);

      if (resp.return_code === 0) {
        const vpwsEntries = await this.getallVpwsFromDut(this.dut1.cli);
        const vpwsEntry_got = vpwsEntries.filter(vpwsEntry_target =>
          vpwsEntry_target.compareTo(vpwsEntry)
        ).length;
        expect(vpwsEntry_got).toEqual(1);
      } else {
        expect(resp.return_code).toEqual(0);
      }
    } finally {
      //
      await this.delVpwsByDut(this.dut1.cli, vpwsEntry);
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test set vpws primary pwpe set action", 300000)
  private async testSetVpwsPrimaryPwpe() {
    const vpwsEntry = new VpwsEntry(new CommonKey("vpws_dut"));

    vpwsEntry.vpwsId = 1234;

    const vpwsUtil = await this.addPwpeForVpws(this.dut1);
    try {
      if (vpwsUtil !== null) {
        await this.addVpwsByDut(this.dut1.cli, vpwsEntry);

        const vpwsEntry_set = new VpwsEntry(vpwsEntry.key);

        const pwpeEntry = vpwsUtil.pwpeEntries[0];

        vpwsEntry_set.wokPwpe = pwpeEntry.key.name;

        vpwsEntry.wokPwpe = vpwsEntry_set.wokPwpe;

        const peer = new DefPeer();
        peer.pw = pwpeEntry.key.name;
        peer.tunnelGroup = pwpeEntry.tunnel;
        peer.inlabel = pwpeEntry.inlabel;
        peer.outlabel = pwpeEntry.outlabel;

        vpwsEntry.peer = peer;

        const resp = await this.setVpwsByRpc(this.dut1.rpc, vpwsEntry_set);

        const vpwsEntries1 = await this.getAllVpwsFromRpc(this.dut1.rpc, {
          start: 0,
          end: 0
        });

        if (resp.return_code === 0) {
          const vpwsEntries = await this.getallVpwsFromDut(this.dut1.cli);
          const vpws_got = vpwsEntries.filter(vpwsEntry_got =>
            vpwsEntry_got.compareTo(vpwsEntry)
          ).length;
          expect(vpws_got).toEqual(1);
        } else {
          expect(resp.return_code).toEqual(0);
        }
      }
    } finally {
      //
      await this.delVpwsByDut(this.dut1.cli, vpwsEntry);
      await this.delPwpeForVpws(this.dut1, vpwsUtil);
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test set vpws primary pwpe update action", 30000)
  private async testDetVPwsPrimaryPwpe02() {
    const vpws_name = "vpws_dut";
    const vpws_key = new CommonKey(vpws_name);
    const vpwsEntry = new VpwsEntry(vpws_key);

    vpwsEntry.vpwsId = 1234;
    const vpwsUtil = await this.addPwpeForVpws(this.dut1);

    try {
      if (vpwsUtil !== null) {
        const pwpeEntry = vpwsUtil.pwpeEntries[0];
        vpwsEntry.wokPwpe = pwpeEntry.key.name;

        const peer = new DefPeer();
        peer.pw = pwpeEntry.key.name;
        peer.tunnelGroup = pwpeEntry.tunnel;
        peer.inlabel = pwpeEntry.inlabel;
        peer.outlabel = pwpeEntry.outlabel;

        vpwsEntry.peer = peer;

        await this.addVpwsByDut(this.dut1.cli, vpwsEntry);

        const vpwsEntry_set = new VpwsEntry(vpwsEntry.key);

        const pwpeEntry_02 = vpwsUtil.pwpeEntries[1];

        vpwsEntry_set.wokPwpe = pwpeEntry_02.key.name;

        const peer_02 = new DefPeer();
        peer_02.pw = pwpeEntry_02.key.name;
        peer_02.tunnelGroup = pwpeEntry_02.tunnel;
        peer_02.inlabel = pwpeEntry_02.inlabel;
        peer_02.outlabel = pwpeEntry_02.outlabel;

        vpwsEntry_set.peer = peer;

        vpwsEntry.peer = vpwsEntry_set.peer;

        const resp = await this.setVpwsByRpc(this.dut1.rpc, vpwsEntry_set);
        if (resp.return_code === 0) {
          const vpwsEntries = await this.getallVpwsFromDut(this.dut1.cli);
          const vpws_got = vpwsEntries.filter(vpwsEntry_got =>
            vpwsEntry_got.compareTo(vpwsEntry)
          );
          expect(vpws_got.length).toEqual(1);
        } else {
          expect(resp.return_code).toEqual(0);
        }
      }
    } finally {
      await this.delVpwsByDut(this.dut1.cli, vpwsEntry);
      await this.delPwpeForVpws(this.dut1, vpwsUtil);
    }
  }

  // ------------------------------------------------------------------------------
  // rpc getall vpws
  private async getAllVpwsFromRpc(
    rpc: RpcClient,
    range: Object
  ): Promise<Array<VpwsEntry>> {
    const resp = await rpc.vpws.getall(range);
    if (resp.return_code === 0) {
      return resp.data.map(vpws => {
        const vpwsEntry = new VpwsEntry(new CommonKey(vpws.key.name));
        vpwsEntry.wokPwpe = vpws.working_pwpe;
        vpwsEntry.status = vpws.status;

        const peerEntry = new DefPeer();
        peerEntry.pw = vpws.peer.pw;
        peerEntry.tunnelGroup = vpws.peer.tunnel_group;
        peerEntry.lsp = vpws.peer.lsp;
        peerEntry.inlabel = vpws.peer.inlabel;
        peerEntry.outlabel = vpws.peer.outlabel;
        peerEntry.pwInter = vpws.peer.pw_interface;
        peerEntry.peerStatus = vpws.peer.peer_status;
        vpwsEntry.peer = peerEntry;

        vpwsEntry.acs = vpws.acs.map(ac => {
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
        return vpwsEntry;
      });
    } else {
      return [];
    }
  }

  // rpc add vpws
  private async addVpwsByRpc(rpc: RpcClient, vpws: VpwsEntry): Promise<any> {
    let acs = vpws.acs.map(ac => {
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

    const param = {
      key: vpws.key.getKey(),
      working_pwpe: vpws.wokPwpe,
      acs: acs
    };
    if (param.working_pwpe === "") delete param.working_pwpe;
    if (param.acs.length === 0) delete param.acs;
    return await rpc.vpws.add(param);
  }

  // rpc del vpws
  private async delVpwsByRpc(rpc: RpcClient, vpws: VpwsEntry): Promise<any> {
    return await rpc.vpws.del({ key: vpws.key.getKey() });
  }

  // rpc set vpws
  private async setVpwsByRpc(rpc: RpcClient, vpws: VpwsEntry): Promise<any> {
    let acs = vpws.acs.map(ac => {
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

    const param = {
      key: vpws.key.getKey(),
      working_pwpe: vpws.wokPwpe,
      acs: acs
    };

    return await rpc.vpws.set(param);
  }

  // dut add vpws
  private async addVpwsByDut(dut: Dut, vpws: VpwsEntry): Promise<any> {
    // 配置 vpws
    if (vpws.key.name !== "" && vpws.vpwsId !== 0) {
      await dut.exec`
        > configure terminal
        > mpls vpws ${vpws.key.name} ${vpws.vpwsId}
      `;
      // 配置 primary pwpe
      if (vpws.wokPwpe !== "") {
        await dut.exec`
          > primary ${vpws.wokPwpe}
        `;
      }
      await dut.exec`
        > end
      `;
    }

    // 配置 ac
    for (let i = 0; i < vpws.acs.length; i++) {
      const acEntry = vpws.acs[i];
      if (vpws.acs.length !== 0) {
        await dut.exec`
          > configure terminal
          > interface ${acEntry.inter}
        `;
        if (acEntry.vlan !== 0 && acEntry.fc === "") {
          await dut.exec`
            > switchport mode trunk
            > mpls-vpws ${vpws.key.name} vlan ${acEntry.vlan} ${
            acEntry.cos !== 0 ? "cos " + acEntry.cos : ""
          }
          `;
        }
        if (acEntry.fc !== "" && acEntry.vlan === 0) {
          await dut.exec`
            > mpls-vpws ${vpws.key.name} filter-class ${acEntry.fc} ${
            acEntry.cos !== 0 ? "cos " + acEntry.cos : ""
          }
          `;
        }
        if (acEntry.fc === "" && acEntry.vlan === 0) {
          await dut.exec`
            > mpls-vpws ${vpws.key.name} ethernet ${
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

  // dut getall vpws
  private async getallVpwsFromDut(dut: Dut): Promise<Array<VpwsEntry>> {
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
            case "mpls-vpws":
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
          // if (ac_arr[i] === "mpls-vpws") {
          //   start = i;
          // }
        }
        return start === 0 ? null : acEntry;
      })
      .filter(acEntry => acEntry !== null)
      .reduce((pre, cur) => {
        pre[cur.vpws] = pre[cur.vpws] ? pre[cur.vpws] : [];
        pre[cur.vpws].push(cur);
        return pre;
      }, {});

    let vpws = output_arr_format
      .filter(ele => {
        return /mpls\svpws.*?\s*/g.test(ele);
      })
      .map(vpws => {
        return vpws.split(/\s/g);
      })
      .map(vpws_arr => {
        if (vpws_arr[1] === "vpws") {
          const key = new CommonKey(vpws_arr[2]);
          const vpwsEntry = new VpwsEntry(key);
          for (let i = 2; i < vpws_arr.length; i++) {
            if (vpws_arr[i] === "primary") {
              vpwsEntry.wokPwpe = vpws_arr[++i];
              break;
            }
          }
          return vpwsEntry;
        }
      })
      .filter(vpwsEntry => vpwsEntry !== null)
      .map(vpws => {
        vpws.acs = acsMap[vpws.key.name] ? acsMap[vpws.key.name] : [];
        vpws.peer = peersMap[vpws.wokPwpe]
          ? peersMap[vpws.wokPwpe]
          : new DefPeer();
        return vpws;
      });
    return vpws;
  }

  // dut del vpws and acs
  private async delVpwsByDut(dut: Dut, vpws: VpwsEntry) {
    await dut.exec`
      > configure terminal
      > no mpls vpws ${vpws.key.name}
      > end
    `;

    if (vpws.acs.length !== 0) {
      await this.delAcs(dut, vpws);
    }
  }

  // -----------------------------------------------------------------------------
  private async addPwpeForVpws(idut: IDut): Promise<VpwsUtil> {
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

    const vpwsUtil = new VpwsUtil();

    vpwsUtil.ports.push(port_09);
    vpwsUtil.ports.push(port_11);
    vpwsUtil.ports.push(port_13);
    vpwsUtil.ports.push(port_15);
    vpwsUtil.ports.push(port_17);
    vpwsUtil.ports.push(port_19);

    vpwsUtil.lsppeEntries.push(lsppeEntry_09);
    vpwsUtil.lsppeEntries.push(lsppeEntry_11);
    vpwsUtil.lsppeEntries.push(lsppeEntry_13);
    vpwsUtil.lsppeEntries.push(lsppeEntry_15);
    vpwsUtil.lsppeEntries.push(lsppeEntry_17);
    vpwsUtil.lsppeEntries.push(lsppeEntry_19);

    vpwsUtil.tunnelEntries.push(tunnelEntry_01);
    vpwsUtil.tunnelEntries.push(tunnelEntry_02);

    vpwsUtil.pwpeEntries.push(pwpeEntry_01);
    vpwsUtil.pwpeEntries.push(pwpeEntry_02);

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
    return hasError ? null : vpwsUtil;
  }

  private async delPwpeForVpws(idut: IDut, vpwsUtil: VpwsUtil) {
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

  // ------------------------------------------------------------------------------

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

  // dut del ac
  private async delAcs(dut: Dut, vpws: VpwsEntry) {
    const acs = vpws.acs;
    await dut.exec`
      > configure terminal
    `;
    for (let i = 0; i < acs.length; i++) {
      const acEntry = acs[i];
      await dut.exec`
        > interface ${acEntry.inter}
      `;

      if (acEntry.fc !== "" && acEntry.vlan === 0) {
        await dut.exec`
          > no mpls-vpws ${vpws.key.name} filter-class ${acEntry.fc}
          > switchport mode access
          > end
        `;
      } else {
        await dut.exec`
          > no mpls-vpws ${vpws.key.name}
          > switchport mode access
          > end
        `;
      }
      //
      // await dut.exec`
      // `;
    }
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
