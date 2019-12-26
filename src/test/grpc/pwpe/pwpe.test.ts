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
import { PwpeUtil } from "./PwpeUtil";

/*
 * @Describe注解用于描述该测试用例所测试的功能
 * 该文字描述会在脚本执行完毕后在终端输出，也会记录到测试报告中，方便用户查看
 * */
@Describe("test pwpe")
class TestPwpe {
  /*
   * @InjectTopo 注解用于给该测试类注入拓扑
   * 初始化该类时注入虚拟拓扑
   * */
  @InjectTopo
  private readonly topo: DoubleDevice;

  private dut1: IDut;
  private dut2: IDut;

  /*
   * 从拓扑中获取设备并进行链接
   * 每个测试例被执行前都将执行该方法，链接设备
   * @BeforeEach　注解会在每一个　@Test注解的测试方法执行前运行
   * */
  @BeforeEach
  private async beforeEach() {
    await this.dut1.cli.connect();
    await this.dut2.cli.connect();
  }

  /*
   * 每个测试用例跑完都断开设备连接
   * 因为每台设备允许的telnet最多链接数是有限的
   * @AfterEach　注解会在每一个　@Test注解的测试方法执行后执行
   * */
  @AfterEach
  private async afterEach() {
    await this.dut1.cli.end();
    await this.dut2.cli.end();
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
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test add pwpe with inlabel outlabel tunnel fields", 300000)
  private async testAddPwpe() {
    const pwpeEntry = new PwpeEntry(new CommonKey("pwpe_rpc"));
    pwpeEntry.inlabel = 3000;
    pwpeEntry.outlabel = 3000;

    const pwpeUtil = await this.addTunnelForPwpe(this.dut1);

    if (pwpeUtil !== null) {
      pwpeEntry.tunnel = pwpeUtil.tunnelEntries[0].key.name;
      try {
        const resp = await this.addPwpeByRpc(this.dut1.rpc, pwpeEntry);
        if (resp.return_code === 0) {
          const pwpeEntries = await this.getAllPwpeFromDut(this.dut1.cli);
          const pwpeEntry_got = pwpeEntries.filter(pwpeEntry_got =>
            pwpeEntry_got.compareTo(pwpeEntry)
          );
          expect(pwpeEntry_got.length).toEqual(1);
        } else {
          expect(resp.return_code).toEqual(0);
        }
      } finally {
        await this.delPwpeByDut(this.dut1.cli, pwpeEntry);
        await this.delTunnelForPwpe(this.dut1, pwpeUtil);
      }
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test del pwpe", 300000)
  private async testDelPwpe() {
    const pwpeEntry = new PwpeEntry(new CommonKey("pwpe_dut"));
    pwpeEntry.inlabel = 3000;
    pwpeEntry.outlabel = 3000;

    const pwpeUtil = await this.addTunnelForPwpe(this.dut1);

    if (pwpeUtil !== null) {
      pwpeEntry.tunnel = pwpeUtil.tunnelEntries[0].key.name;
      try {
        await this.addPwpeByDut(this.dut1.cli, pwpeEntry);

        const resp = await this.delPwpeByRpc(this.dut1.rpc, pwpeEntry);

        if (resp.return_code === 0) {
          const pwpeEntries = await this.getAllPwpeFromDut(this.dut1.cli);
          const pwpeEntry_got = pwpeEntries.filter(pwpeEntry_got =>
            pwpeEntry_got.compareTo(pwpeEntry)
          );
          expect(pwpeEntry_got.length).toEqual(0);
        } else {
          expect(resp.return_code).toEqual(0);
        }
      } finally {
        await this.delTunnelForPwpe(this.dut1, pwpeUtil);
      }
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test get all pwpe", 300000)
  private async testGetAllPwpe() {
    const pwpeEntry_01 = new PwpeEntry(new CommonKey("pwpe_dut_01"));
    pwpeEntry_01.inlabel = 3001;
    pwpeEntry_01.outlabel = 3001;

    const pwpeEntry_02 = new PwpeEntry(new CommonKey("pwpe_dut_02"));
    pwpeEntry_02.inlabel = 3002;
    pwpeEntry_02.outlabel = 3002;

    const pwpeEntry_03 = new PwpeEntry(new CommonKey("pwpe_dut_03"));

    const pwpeUtil = await this.addTunnelForPwpe(this.dut1);

    pwpeEntry_01.tunnel = pwpeUtil.tunnelEntries[0].key.name;
    pwpeEntry_02.tunnel = pwpeUtil.tunnelEntries[1].key.name;

    if (pwpeUtil !== null) {
      try {
        await this.addPwpeByDut(this.dut1.cli, pwpeEntry_01);
        await this.addPwpeByDut(this.dut1.cli, pwpeEntry_02);
        await this.addPwpeByDut(this.dut1.cli, pwpeEntry_03);

        const pwpeEntries = await this.getAllPwpeFromRpc(this.dut1.rpc, {
          start: 0,
          end: 0
        });

        if (pwpeEntries.length > 0) {
          const pwpeEntry_got = pwpeEntries.filter(
            pwpeEntry_got =>
              pwpeEntry_got.compareTo(pwpeEntry_01) ||
              pwpeEntry_got.compareTo(pwpeEntry_02) ||
              pwpeEntry_got.compareTo(pwpeEntry_03)
          );
          expect(pwpeEntry_got.length).toEqual(3);
        } else {
          expect(pwpeEntries.length).not.toEqual(0);
        }
      } finally {
        await this.delPwpeByDut(this.dut1.cli, pwpeEntry_01);
        await this.delPwpeByDut(this.dut1.cli, pwpeEntry_02);
        await this.delPwpeByDut(this.dut1.cli, pwpeEntry_03);
        await this.delTunnelForPwpe(this.dut1, pwpeUtil);
      }
    } else {
      expect(pwpeUtil).not.toBeNull();
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test get pwpe with no tunnel config", 300000)
  private async testGetAllPwpeWithSingle() {
    const pwpeEntry = new PwpeEntry(new CommonKey("pwpe_dut"));
    try {
      await this.addPwpeByDut(this.dut1.cli, pwpeEntry);

      const pwpeEntries = await this.getAllPwpeFromRpc(this.dut1.rpc, {
        start: 0,
        end: 0
      });

      if (pwpeEntries.length > 0) {
        const pwpeEntry_got = pwpeEntries.filter(pwpeEntry_got =>
          pwpeEntry_got.compareTo(pwpeEntry)
        );
        expect(pwpeEntry_got.length).toEqual(1);
      } else {
        expect(pwpeEntries.length).not.toEqual(0);
      }
    } finally {
      await this.delPwpeByDut(this.dut1.cli, pwpeEntry);
    }
  }
  // rpc getall pwpe
  private async getAllPwpeFromRpc(
    rpc: RpcClient,
    range: object
  ): Promise<Array<PwpeEntry>> {
    const resp = await rpc.pwpe.getall(range);
    if (resp.return_code === 0) {
      return resp.data.map(pwpe => {
        const key = new CommonKey(pwpe.key.name);
        const pwpeEntry = new PwpeEntry(key);
        // pwpeEntry.inlabel = pwpe.inlabel === 1048576 ? 0 : pwpe.inlabel;
        pwpeEntry.inlabel = pwpe.inlabel;
        pwpeEntry.outlabel = pwpe.outlabel;
        pwpeEntry.tunnel = pwpe.tunnel_smart_group_key;
        return pwpeEntry;
      });
    } else {
      return [];
    }
  }

  // rpc add pwpe
  private async addPwpeByRpc(rpc: RpcClient, pwpe: PwpeEntry): Promise<any> {
    return await rpc.pwpe.add(pwpe.getPwpe());
  }

  // rpc del pwpe
  private async delPwpeByRpc(
    rpc: RpcClient,
    pwpeEntry: PwpeEntry
  ): Promise<any> {
    return await rpc.pwpe.del({
      key: pwpeEntry.key.getKey()
    });
  }

  // dut getall pwpe
  private async getAllPwpeFromDut(dut: Dut): Promise<Array<PwpeEntry>> {
    const output = await dut.exec`
      > show run
    `;
    let output_arr = output
      .replace(/\r\n/g, " ")
      .replace(/\u001b\[\d*\w/g, "")
      .split("!");

    let output_arr_format = output_arr
      .map(ele => {
        return ele
          .replace(/[\r\n]+/g, "")
          .replace(/\s{2,}/g, " ")
          .trim();
      })
      .filter(ele => {
        return /mpls\spw\st-pe.*?\s+/g.test(ele);
      })
      .map(lsppe => {
        return lsppe.split(/\s/g);
      });

    if (output_arr_format.length > 0) {
      return output_arr_format.map(pwpe_arr => {
        if (pwpe_arr[2] === "t-pe") {
          const key = new CommonKey(pwpe_arr[3]);
          const pwpeEntry = new PwpeEntry(key);
          for (let i = 2; i < pwpe_arr.length; i++) {
            switch (pwpe_arr[i]) {
              case "inlabel":
                pwpeEntry.inlabel = parseInt(pwpe_arr[++i]);
                break;
              case "outlabel":
                pwpeEntry.outlabel = parseInt(pwpe_arr[++i]);
                break;
              case "tunnel":
                pwpeEntry.tunnel = pwpe_arr[++i];
                break;
            }
          }
          return pwpeEntry;
        }
      });
    } else {
      return [];
    }
  }

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

  // --------------------------------------------------------------------
  private async addTunnelForPwpe(idut: IDut): Promise<PwpeUtil> {
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

    let hasError = false;

    const pwpeUtil = new PwpeUtil();

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

      await this.addTunnelByDut(dut, tunnelEntry_01);
      await this.addTunnelByDut(dut, tunnelEntry_02);

      pwpeUtil.ports.push(port_09);
      pwpeUtil.ports.push(port_11);
      pwpeUtil.ports.push(port_13);
      pwpeUtil.ports.push(port_15);
      pwpeUtil.ports.push(port_17);
      pwpeUtil.ports.push(port_19);

      pwpeUtil.lsppeEntries.push(lsppeEntry_09);
      pwpeUtil.lsppeEntries.push(lsppeEntry_11);
      pwpeUtil.lsppeEntries.push(lsppeEntry_13);
      pwpeUtil.lsppeEntries.push(lsppeEntry_15);
      pwpeUtil.lsppeEntries.push(lsppeEntry_17);
      pwpeUtil.lsppeEntries.push(lsppeEntry_19);

      pwpeUtil.tunnelEntries.push(tunnelEntry_01);
      pwpeUtil.tunnelEntries.push(tunnelEntry_02);
    } catch (e) {
      console.log("error: ", e.message);
      hasError = true;
    }
    return hasError ? null : pwpeUtil;
  }

  private async delTunnelForPwpe(idut: IDut, pwpeUtil: PwpeUtil) {
    if (pwpeUtil !== null) {
      for (let tunnelEntry of pwpeUtil.tunnelEntries) {
        await this.delTunnelByDut(idut.cli, tunnelEntry);
      }

      for (let lsppeEntry of pwpeUtil.lsppeEntries) {
        await this.delLsppeByDut(idut.cli, lsppeEntry);
      }

      for (let port of pwpeUtil.ports) {
        await this.disablePortMpls(idut.cli, port);
      }
    } else {
      console.log("there is no config");
    }
  }
  // ---------------------------------------------------------------------

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
