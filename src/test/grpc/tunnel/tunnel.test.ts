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
import { ipToNumber, numberToIp } from "../../../utils";
import { DefProtectLsp } from "../mpls/DefProtectLsp";
import { CommonKey } from "../mpls/CommonKey";
import { LsppeEntry } from "../mpls/LsppeEntry";
import { TunnelEntry } from "../mpls/TunnelEntry";
import { TunnelUntil } from "./TunnelUntil";
import { IDut } from "../../../topos/definitions";

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
  // private dut2: IDut;

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
    // this.dut2 = this.topo.dut2;
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test add tunnel", 30000)
  private async testAddTunnel() {
    const tunnelEntry = new TunnelEntry(new CommonKey("tunnel_rpc"));

    const tunnelUntil = await this.addLspForTunnel(this.dut1);
    if (tunnelUntil !== null) {
      const lsppeEntries = tunnelUntil.lsppeEntries;

      tunnelEntry.workLsp = lsppeEntries[0].key.name;
      const lsp2 = new DefProtectLsp(lsppeEntries[1].key.name);
      const lsp3 = new DefProtectLsp(lsppeEntries[2].key.name);
      const lsp4 = new DefProtectLsp(lsppeEntries[3].key.name);
      lsp2.weight = 3;
      lsp3.weight = 2;
      lsp4.weight = 1;
      tunnelEntry.protectLsp.push(lsp2);
      tunnelEntry.protectLsp.push(lsp3);
      tunnelEntry.protectLsp.push(lsp4);
      try {
        const resp = await this.addTunnelByRpc(this.dut1.rpc, tunnelEntry);

        if (resp.return_code === 0) {
          const tunnel_got = await this.getTunnelFromDut(this.dut1.cli);
          const tunnel_target = tunnel_got.filter(tunnel =>
            tunnel.compareTo(tunnelEntry)
          );
          expect(tunnel_target.length).toEqual(1);
        } else {
          expect(resp.return_code).toEqual(0);
        }
      } finally {
        await this.delTunnelByDut(this.dut1.cli, tunnelEntry);
        await this.delLspForTunnel(this.dut1, tunnelUntil);
      }
    } else {
      expect(tunnelUntil).not.toBeNull();
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test del tunnel", 30000)
  private async testDelTunnel() {
    const tunnelEntry = new TunnelEntry(new CommonKey("tunnel_dut"));

    const tunnelUntil = await this.addLspForTunnel(this.dut1);
    if (tunnelUntil !== null) {
      const lsppeEntries = tunnelUntil.lsppeEntries;

      tunnelEntry.workLsp = lsppeEntries[0].key.name;
      const lsp2 = new DefProtectLsp(lsppeEntries[1].key.name);
      const lsp3 = new DefProtectLsp(lsppeEntries[2].key.name);
      const lsp4 = new DefProtectLsp(lsppeEntries[3].key.name);
      lsp2.weight = 3;
      lsp3.weight = 2;
      lsp4.weight = 1;
      tunnelEntry.protectLsp.push(lsp2);
      tunnelEntry.protectLsp.push(lsp3);
      tunnelEntry.protectLsp.push(lsp4);
      try {
        await this.addTunnelByDut(this.dut1.cli, tunnelEntry);
        const resp = await this.delTunnelByRpc(this.dut1.rpc, tunnelEntry);
        if (resp.return_code === 0) {
          const tunnel_got = await this.getTunnelFromDut(this.dut1.cli);
          const tunnel_target = tunnel_got.filter(tunnel =>
            tunnel.compareTo(tunnelEntry)
          );
          expect(tunnel_target.length).toEqual(0);
        } else {
          expect(resp.return_code).toEqual(0);
        }
      } finally {
        await this.delLspForTunnel(this.dut1, tunnelUntil);
      }
    } else {
      expect(tunnelUntil).not.toBeNull();
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test set tunnel primary work lsppe", 30000)
  private async testSetTunnelWorkLsppe() {
    const tunnelEntry = new TunnelEntry(new CommonKey("tunnel_dut"));

    const tunnelUntil = await this.addLspForTunnel(this.dut1);
    if (tunnelUntil !== null) {
      const lsppeEntries = tunnelUntil.lsppeEntries;

      tunnelEntry.workLsp = lsppeEntries[0].key.name;
      const lsp2 = new DefProtectLsp(lsppeEntries[1].key.name);
      const lsp3 = new DefProtectLsp(lsppeEntries[2].key.name);
      const lsp4 = new DefProtectLsp(lsppeEntries[3].key.name);
      lsp2.weight = 3;
      lsp3.weight = 2;
      lsp4.weight = 1;
      tunnelEntry.protectLsp.push(lsp2);
      tunnelEntry.protectLsp.push(lsp3);
      tunnelEntry.protectLsp.push(lsp4);

      try {
        await this.addTunnelByDut(this.dut1.cli, tunnelEntry);

        const tunnelEntry_set = new TunnelEntry(tunnelEntry.key);
        tunnelEntry_set.workLsp = lsppeEntries[4].key.name;

        const resp = await this.setTunnelByRpc(this.dut1.rpc, tunnelEntry_set);

        tunnelEntry.workLsp = tunnelEntry_set.workLsp;
        if (resp.return_code === 0) {
          const tunnel_got = await this.getTunnelFromDut(this.dut1.cli);
          const tunnel_target = tunnel_got.filter(tunnel =>
            tunnel.compareTo(tunnelEntry)
          );
          expect(tunnel_target.length).toEqual(1);
        } else {
          expect(resp.return_code).toEqual(0);
        }
      } finally {
        await this.delTunnelByDut(this.dut1.cli, tunnelEntry);
        await this.delLspForTunnel(this.dut1, tunnelUntil);
      }
    } else {
      expect(tunnelUntil).not.toBeNull();
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test set tunnel protect lsppe", 300000)
  private async testSetTunnelProtectLsppe() {
    const tunnelEntry = new TunnelEntry(new CommonKey("tunnel_dut"));

    const tunnelUntil = await this.addLspForTunnel(this.dut1);
    if (tunnelUntil !== null) {
      const lsppeEntries = tunnelUntil.lsppeEntries;

      tunnelEntry.workLsp = lsppeEntries[0].key.name;
      const lsp2 = new DefProtectLsp(lsppeEntries[1].key.name);
      const lsp3 = new DefProtectLsp(lsppeEntries[2].key.name);
      const lsp4 = new DefProtectLsp(lsppeEntries[3].key.name);
      lsp2.weight = 3;
      lsp3.weight = 2;
      lsp4.weight = 1;
      tunnelEntry.protectLsp.push(lsp2);
      tunnelEntry.protectLsp.push(lsp3);
      tunnelEntry.protectLsp.push(lsp4);

      try {
        await this.addTunnelByDut(this.dut1.cli, tunnelEntry);

        const tunnelEntry_set = new TunnelEntry(tunnelEntry.key);

        // tunnelEntry_set.workLsp = tunnelEntry.workLsp;
        const lsp2_set = new DefProtectLsp(lsppeEntries[4].key.name);
        const lsp3_set = new DefProtectLsp(lsppeEntries[5].key.name);
        lsp2_set.weight = 4;
        lsp3_set.weight = 5;
        tunnelEntry_set.protectLsp.push(lsp2_set);
        tunnelEntry_set.protectLsp.push(lsp3_set);

        const resp = await this.setTunnelByRpc(this.dut1.rpc, tunnelEntry_set);

        tunnelEntry.protectLsp = tunnelEntry_set.protectLsp;
        if (resp.return_code === 0) {
          const tunnel_got = await this.getTunnelFromDut(this.dut1.cli);
          const tunnel_target = tunnel_got.filter(tunnel =>
            tunnel.compareTo(tunnelEntry)
          );
          expect(tunnel_target.length).toEqual(1);
        } else {
          expect(resp.return_code).toEqual(0);
        }
      } finally {
        await this.delTunnelByDut(this.dut1.cli, tunnelEntry);
        await this.delLspForTunnel(this.dut1, tunnelUntil);
      }
    } else {
      expect(tunnelUntil).not.toBeNull();
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test get all tunnel", 3000000)
  private async testGetAllTunnel() {
    const tunnelEntry_01 = new TunnelEntry(new CommonKey("tunnel_dut_1"));

    const tunnelUntil = await this.addLspForTunnel(this.dut1);
    if (tunnelUntil !== null) {
      const lsppeEntries = tunnelUntil.lsppeEntries;

      tunnelEntry_01.workLsp = lsppeEntries[0].key.name;
      const tunnel_01_lsp2 = new DefProtectLsp(lsppeEntries[1].key.name);
      const tunnel_01_lsp3 = new DefProtectLsp(lsppeEntries[2].key.name);
      tunnel_01_lsp2.weight = 3;
      tunnel_01_lsp3.weight = 2;
      tunnelEntry_01.protectLsp.push(tunnel_01_lsp2);
      tunnelEntry_01.protectLsp.push(tunnel_01_lsp3);

      const tunnelEntry_02 = new TunnelEntry(new CommonKey("tunnel_dut_02"));
      tunnelEntry_02.workLsp = lsppeEntries[3].key.name;
      const tunnel_02_lsp2 = new DefProtectLsp(lsppeEntries[4].key.name);
      tunnel_02_lsp2.weight = 6;
      tunnelEntry_02.protectLsp.push(tunnel_02_lsp2);

      const tunnelEntry_03 = new TunnelEntry(new CommonKey("tunnel_dut_03"));
      tunnelEntry_03.workLsp = lsppeEntries[5].key.name;
      try {
        await this.addTunnelByDut(this.dut1.cli, tunnelEntry_01);
        await this.addTunnelByDut(this.dut1.cli, tunnelEntry_02);
        await this.addTunnelByDut(this.dut1.cli, tunnelEntry_03);

        const tunnels = await this.getTunnlesByRpc(this.dut1.rpc, {
          start: 0,
          end: 0
        });

        if (tunnels.length > 0) {
          const tunnel_rpc = tunnels.filter(
            tunnelEntry_got =>
              tunnelEntry_got.compareTo(tunnelEntry_01) ||
              tunnelEntry_got.compareTo(tunnelEntry_02) ||
              tunnelEntry_got.compareTo(tunnelEntry_03)
          );
          expect(tunnel_rpc.length).toEqual(3);
        } else {
          expect(tunnels.length).not.toEqual(0);
        }
      } finally {
        await this.delTunnelByDut(this.dut1.cli, tunnelEntry_01);
        await this.delTunnelByDut(this.dut1.cli, tunnelEntry_02);
        await this.delTunnelByDut(this.dut1.cli, tunnelEntry_03);
        await this.delLspForTunnel(this.dut1, tunnelUntil);
      }
    } else {
      expect(tunnelUntil).not.toBeNull();
    }
  }

  // --------------------------------------------------------------------------------
  // rpc getall tunnel
  private async getTunnlesByRpc(
    rpc: RpcClient,
    range: object
  ): Promise<Array<TunnelEntry>> {
    const resp = await rpc.tunnel_smart_group.getall(range);
    if (resp.return_code === 0) {
      return resp.data.map(tunnel => {
        const key = new CommonKey(tunnel.key.name);
        const tunnelEntry = new TunnelEntry(key);
        tunnelEntry.workLsp = tunnel.work_lsp;
        tunnelEntry.protectLsp = tunnel.protect_lsp.map(pLsp => {
          const defPLsp = new DefProtectLsp(pLsp.name);
          defPLsp.weight = pLsp.weight;
          return defPLsp;
        });
        return tunnelEntry;
      });
    } else {
      return [];
    }
  }

  // rpc add tunnel
  private async addTunnelByRpc(
    rpc: RpcClient,
    tunnelEntry: TunnelEntry
  ): Promise<any> {
    return await rpc.tunnel_smart_group.add(tunnelEntry.getTunnel());
  }

  // rpc set tunnel
  private async setTunnelByRpc(
    rpc: RpcClient,
    tunnel: TunnelEntry
  ): Promise<any> {
    return await rpc.tunnel_smart_group.set(tunnel.getTunnel());
  }

  // rpc del tunnel
  private async delTunnelByRpc(
    rpc: RpcClient,
    tunnelEntry: TunnelEntry
  ): Promise<any> {
    return await rpc.tunnel_smart_group.del({
      key: tunnelEntry.key.getKey()
    });
  }

  // dut getall protect lsppe
  private async getDefProtectLsp(
    output_arr: Array<string>
  ): Promise<Array<DefProtectLsp>> {
    let mpls_lsppes = output_arr
      .map(ele => {
        return ele
          .replace(/[\r\n]+/g, "")
          .replace(/\s{2,}/g, " ")
          .trim();
      })
      .filter(ele => {
        return /mpls\slsp-pe.*?\s+/g.test(ele);
      })
      .map(lsppe => {
        return lsppe.split(/\s/g);
      });

    if (mpls_lsppes.length > 0) {
      return mpls_lsppes.map(lsppe_ele_arr => {
        if (lsppe_ele_arr[1] === "lsp-pe") {
          const defPLsp = new DefProtectLsp(lsppe_ele_arr[2]);

          for (let i = 3; i < lsppe_ele_arr.length; i++) {
            if (lsppe_ele_arr[i] === "weight") {
              defPLsp.weight = parseInt(lsppe_ele_arr[i + 1]);
              break;
            }
          }
          return defPLsp;
        }
      });
    } else {
      return [];
    }
  }

  // dut add tunnel
  private async addTunnelByDut(dut: Dut, tunnel: TunnelEntry) {
    const protect_lsp = tunnel.protectLsp;
    const work_lsp = tunnel.workLsp;

    if (work_lsp) {
      await dut.exec`
        > configure terminal
        > mpls lsp-pe ${work_lsp}
        > weight 0
        > end
      `;
    }

    for (let i = 0; i < protect_lsp.length; i++) {
      await dut.exec`
        > configure terminal
        > mpls lsp-pe ${protect_lsp[i].name}
        > weight ${protect_lsp[i].weight}
        > end
      `;
    }

    await dut.exec`
      > configure terminal
      > mpls n21tunnel ${tunnel.key.name} aps
    `;
    if (work_lsp) {
      await dut.exec`
        > lsp1 ${work_lsp}
      `;
    }

    for (let i = 0; i < protect_lsp.length; i++) {
      await dut.exec`
        > lsp${i + 2} ${protect_lsp[i].name}
      `;
    }
    await dut.exec`> end`;
  }

  // dut getall tunnel
  private async getTunnelFromDut(dut: Dut) {
    const output = await dut.exec`
      > show run
    `;

    let output_arr = output
      .replace(/\r\n/g, " ")
      .replace(/\u001b\[\d*\w/g, "")
      .split("!");

    const defPLsps = await this.getDefProtectLsp(output_arr);

    let mpls_tunnels = output_arr
      .map(ele => {
        return ele
          .replace(/[\r\n]+/g, "")
          .replace(/\s{2,}/g, " ")
          .trim();
      })
      .filter(ele => {
        return /mpls\sn21tunnel.*?\s+/g.test(ele);
      })
      .map(lsppe => {
        return lsppe.split(/\s/g);
      });

    if (mpls_tunnels.length > 0) {
      return mpls_tunnels.map(tunnel_ele_arr => {
        if (tunnel_ele_arr[1] === "n21tunnel") {
          const key = new CommonKey(tunnel_ele_arr[2]);
          const tunnel = new TunnelEntry(key);

          const lspkeys = [];
          for (let i = 3; i < tunnel_ele_arr.length; i++) {
            const ele = tunnel_ele_arr[i];
            if (
              ele === "lsp1" ||
              ele === "lsp2" ||
              ele === "lsp3" ||
              ele === "lsp4"
            ) {
              lspkeys.push(tunnel_ele_arr[++i]);
            }
          }

          const protectLsps_tunnel = defPLsps.filter(defPLsp => {
            if (lspkeys.indexOf(defPLsp.name) >= 0) {
              if (defPLsp.weight === 0) {
                tunnel.workLsp = defPLsp.name;
                return false;
              } else {
                return true;
              }
            } else {
              return false;
            }
          });

          tunnel.protectLsp = protectLsps_tunnel;
          return tunnel;
        }
      });
    } else {
      return [];
    }
  }

  // dut del tunnel
  private async delTunnelByDut(dut: Dut, tunnel: TunnelEntry) {
    await dut.exec`
      > configure terminal
      > no mpls n21tunnel ${tunnel.key.name}
      > end
    `;
  }

  // -------------------------------------------------------------------

  private async addLspForTunnel(idut: IDut): Promise<TunnelUntil> {
    const dut = idut.cli;
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

    lsppeEntry_11.inLabel = 2011;
    lsppeEntry_11.outLabel = 2011;
    lsppeEntry_11.nexthopIp = ip_port_11_num;

    lsppeEntry_13.inLabel = 2013;
    lsppeEntry_13.outLabel = 2013;
    lsppeEntry_13.nexthopIp = ip_port_13_num;

    lsppeEntry_15.inLabel = 2015;
    lsppeEntry_15.outLabel = 2015;
    lsppeEntry_15.nexthopIp = ip_port_15_num;

    lsppeEntry_17.inLabel = 2017;
    lsppeEntry_17.outLabel = 2017;
    lsppeEntry_17.nexthopIp = ip_port_17_num;

    lsppeEntry_19.inLabel = 2019;
    lsppeEntry_19.outLabel = 2019;
    lsppeEntry_19.nexthopIp = ip_port_19_num;

    let hasError = false;

    const tunnelUntil = new TunnelUntil();

    try {
      await this.enablePortMpls(dut, port_09, ip_port_09);
      await this.enablePortMpls(dut, port_11, ip_port_11);
      await this.enablePortMpls(dut, port_13, ip_port_13);
      await this.enablePortMpls(dut, port_15, ip_port_15);
      await this.enablePortMpls(dut, port_17, ip_port_17);
      await this.enablePortMpls(dut, port_19, ip_port_19);

      await this.addLspByDut(dut, lsppeEntry_09);
      await this.addLspByDut(dut, lsppeEntry_11);
      await this.addLspByDut(dut, lsppeEntry_13);
      await this.addLspByDut(dut, lsppeEntry_15);
      await this.addLspByDut(dut, lsppeEntry_17);
      await this.addLspByDut(dut, lsppeEntry_19);

      tunnelUntil.ports.push(port_09);
      tunnelUntil.ports.push(port_11);
      tunnelUntil.ports.push(port_13);
      tunnelUntil.ports.push(port_15);
      tunnelUntil.ports.push(port_17);
      tunnelUntil.ports.push(port_19);

      tunnelUntil.lsppeEntries.push(lsppeEntry_09);
      tunnelUntil.lsppeEntries.push(lsppeEntry_11);
      tunnelUntil.lsppeEntries.push(lsppeEntry_13);
      tunnelUntil.lsppeEntries.push(lsppeEntry_15);
      tunnelUntil.lsppeEntries.push(lsppeEntry_17);
      tunnelUntil.lsppeEntries.push(lsppeEntry_19);
    } catch (e) {
      console.log("error: ", e.message);
      hasError = true;
    }
    return hasError ? null : tunnelUntil;
  }

  private async delLspForTunnel(idut: IDut, tunnelUntil: TunnelUntil) {
    const dut = idut.cli;
    if (tunnelUntil !== null) {
      const ports = tunnelUntil.ports;
      const lsppeEntries = tunnelUntil.lsppeEntries;
      for (let port of ports) {
        await this.disablePortMpls(dut, port);
      }
      for (let lsppeEntry of lsppeEntries) {
        await this.removeLsppeByDut(dut, lsppeEntry);
      }
    } else {
      console.log("there is no lsppe config of this dut");
    }
  }

  // -------------------------------------------------------------------

  // dut add lsppe
  private async addLspByDut(dut: Dut, lspEntry: LsppeEntry) {
    const ip = await numberToIp(lspEntry.nexthopIp);
    await dut.exec`
      > configure terminal
      > mpls lsp-pe ${lspEntry.key.name}
      > inlabel ${lspEntry.inLabel}
      > outlabel ${lspEntry.outLabel} ${ip}
      > bhh auto
      > weight ${lspEntry.weight}
      > end
    `;
  }

  // dut del lsppe
  private async removeLsppeByDut(dut: Dut, lsppe: LsppeEntry) {
    await dut.exec`
      > configure terminal
      > no mpls lsp-pe ${lsppe.key.name}
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
}
