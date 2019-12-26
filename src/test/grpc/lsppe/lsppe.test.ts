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
import { CommonKey } from "../mpls/CommonKey";
import { LsppeEntry } from "../mpls/LsppeEntry";

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

  private dut1: Dut;
  private dut2: Dut;

  private rpc_dut1: RpcClient;
  private rpc_dut2: RpcClient;

  private port_dut1_13: string;
  private port_dut1_15: string;
  private port_dut1_17: string;
  private port_dut1_19: string;

  private port_dut2_13: string;
  private port_dut2_15: string;
  private port_dut2_17: string;
  private port_dut2_19: string;

  private ip_dut1_13: string = "13.13.13.1";
  private ip_dut1_15: string = "15.15.15.1";
  private ip_dut1_17: string = "17.17.17.1";
  private ip_dut1_19: string = "19.19.19.1";

  private ip_dut2_13: string = "13.13.13.2";
  private ip_dut2_15: string = "15.15.15.2";
  private ip_dut2_17: string = "17.17.17.2";
  private ip_dut2_19: string = "19.19.19.2";

  private ip_dut1_13_num: number;
  private ip_dut1_15_num: number;
  private ip_dut1_17_num: number;
  private ip_dut1_19_num: number;

  private ip_dut2_13_num: number;
  private ip_dut2_15_num: number;
  private ip_dut2_17_num: number;
  private ip_dut2_19_num: number;

  /*
   * 从拓扑中获取设备并进行链接
   * 每个测试例被执行前都将执行该方法，链接设备
   * @BeforeEach　注解会在每一个　@Test注解的测试方法执行前运行
   * */
  @BeforeEach
  private async beforeEach() {
    await this.dut1.connect();
    // await this.dut2.connect();
  }

  /*
   * 每个测试用例跑完都断开设备连接
   * 因为每台设备允许的telnet最多链接数是有限的
   * @AfterEach　注解会在每一个　@Test注解的测试方法执行后执行
   * */
  @AfterEach
  private async afterEach() {
    await this.dut1.end();
    // await this.dut2.end();
  }

  /*
   * @BeforeAll注解会在所有@Test注解的测试方法前运行，
   * 只运行一次
   * 用于初始化一些数据
   * */
  @BeforeAll
  private async init() {
    this.dut1 = this.topo.dut1.cli;
    this.dut2 = this.topo.dut2.cli;

    this.rpc_dut1 = this.topo.dut2.rpc;
    this.rpc_dut2 = this.topo.dut1.rpc;

    this.port_dut1_13 = this.topo.dut1.port[12];
    this.port_dut1_15 = this.topo.dut1.port[14];
    this.port_dut1_17 = this.topo.dut1.port[16];
    this.port_dut1_19 = this.topo.dut1.port[18];

    this.port_dut2_13 = this.topo.dut2.port[12];
    this.port_dut2_15 = this.topo.dut2.port[14];
    this.port_dut2_17 = this.topo.dut2.port[16];
    this.port_dut2_19 = this.topo.dut2.port[18];

    this.ip_dut1_13_num = await ipToNumber(this.ip_dut1_13);
    this.ip_dut1_15_num = await ipToNumber(this.ip_dut1_15);
    this.ip_dut1_17_num = await ipToNumber(this.ip_dut1_17);
    this.ip_dut1_19_num = await ipToNumber(this.ip_dut1_19);

    this.ip_dut2_13_num = await ipToNumber(this.ip_dut2_13);
    this.ip_dut2_15_num = await ipToNumber(this.ip_dut2_15);
    this.ip_dut2_17_num = await ipToNumber(this.ip_dut2_17);
    this.ip_dut2_19_num = await ipToNumber(this.ip_dut2_19);
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test add a lsppe with key of number", 30000)
  private async testAddLsppe_nubelKey() {
    const lsppeEntry = new LsppeEntry(new CommonKey("123456"));
    lsppeEntry.inLabel = 1000;
    lsppeEntry.outLabel = 1000;
    lsppeEntry.nexthopIp = this.ip_dut1_17_num;
    try {
      await this.enablePortMpls(this.dut1, this.port_dut2_17, this.ip_dut2_17);
      await this.addLsppeByRpc(this.rpc_dut1, lsppeEntry);
    } finally {
      //
      await this.delLsppeByDut(this.dut1, lsppeEntry.key.name);
      await this.disablePortMpls(this.dut1, this.port_dut2_17);
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test add a lsppe in single device")
  private async testAddLsppe_single() {
    const key = new CommonKey("lsppe_dut1_17");

    const lspEntry_dut1 = new LsppeEntry(key);
    lspEntry_dut1.inLabel = 1000;
    lspEntry_dut1.outLabel = 1001;
    lspEntry_dut1.nexthopIp = this.ip_dut2_17_num;

    try {
      // dut port mpls enable
      await this.enablePortMpls(this.dut1, this.port_dut1_17, this.ip_dut1_17);

      // rpc add lsppe
      const resp = await this.addLsppeByRpc(this.rpc_dut1, lspEntry_dut1);

      if (resp.return_code === 0) {
        const lsppes_got = await this.getLsppesFromDut(this.dut1);

        const lsppe_target = lsppes_got.filter(lsppe =>
          lsppe.compareTo(lspEntry_dut1)
        );

        expect(lsppe_target.length).toEqual(1);
      } else {
        expect(resp.return_code).toEqual(0);
      }
    } finally {
      await this.disablePortMpls(this.dut1, this.port_dut1_17);
      await this.delLsppeByDut(this.dut1, key.name);
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test delete lsppe")
  private async testDelLsppe() {
    const key = new CommonKey("lsppe_dut1_17");

    const lspEntry_dut1 = new LsppeEntry(key);
    lspEntry_dut1.inLabel = 800;
    lspEntry_dut1.outLabel = 801;
    lspEntry_dut1.nexthopIp = this.ip_dut2_17_num;

    try {
      // dut port mpls enable
      await this.enablePortMpls(this.dut1, this.port_dut1_17, this.ip_dut1_17);

      // dut add lsppe
      await this.addLsppeByDut(this.dut1, lspEntry_dut1);

      const resp = await this.delLsppeByRpc(this.rpc_dut1, key.name);

      if (resp.return_code === 0) {
        const lsppes_got = await this.getLsppesFromDut(this.dut1);

        const lsppe_target = lsppes_got.filter(lsppe =>
          lsppe.compareTo(lspEntry_dut1)
        );

        expect(lsppe_target.length).toEqual(0);
      } else {
        expect(resp.return_code).toEqual(0);
      }
    } finally {
      await this.disablePortMpls(this.dut1, this.port_dut1_17);
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test getAll lsppe", 30000)
  private async testGetAllLsppe() {
    const lsp_key_13 = new CommonKey("lsp13");
    const lsppeEntry_13 = new LsppeEntry(lsp_key_13);
    lsppeEntry_13.inLabel = 2013;
    lsppeEntry_13.outLabel = 2013;
    lsppeEntry_13.nexthopIp = this.ip_dut2_13_num;
    try {
      // dut port mpls enable
      await this.enablePortMpls(this.dut1, this.port_dut1_13, this.ip_dut1_13);
      //create lsppe
      await this.addLsppeByDut(this.dut1, lsppeEntry_13);

      // rpc getall lsppe
      const lsppeEntries = await this.getLsppesFromRpc(this.rpc_dut1, {
        start: 0,
        end: 0
      });

      // verity
      if (lsppeEntries.length > 0) {
        const lsppe_rpc = lsppeEntries.filter(lsppeEntry_got =>
          lsppeEntry_got.compareTo(lsppeEntry_13)
        );
        expect(lsppe_rpc.length).toEqual(1);
      } else {
        expect(lsppeEntries.length).not.toEqual(0);
      }
    } finally {
      await this.delLsppeByDut(this.dut1, "lsp13");
      await this.disablePortMpls(this.dut1, this.port_dut1_13);
    }
  }

  // rpc getall lsppe
  private async getLsppesFromRpc(
    rpc: RpcClient,
    range: object
  ): Promise<Array<LsppeEntry>> {
    const resp = await rpc.lsppe.getall(range);
    if (resp.return_code === 0) {
      return resp.data.map(lsppe => {
        const key = new CommonKey(lsppe.key.name);
        const lspEntry = new LsppeEntry(key);
        lspEntry.inLabel = lsppe.inlabel;
        lspEntry.outLabel = lsppe.outlabel;
        lspEntry.nexthopIp = lsppe.nexthop_ip;
        lspEntry.port = lsppe.port;
        lspEntry.destMac = lsppe.dest_mac;
        lspEntry.bhhAuto = lsppe.bhh_auto;
        lspEntry.oam = lsppe.oam;
        lspEntry.statsEn = lsppe.stats_en;
        lspEntry.serviceQueue = lsppe.service_queue;
        lspEntry.bhhStatus = lsppe.bhh_status;
        lspEntry.oif = lsppe.oif;
        lspEntry.ctrlLocalId = lsppe.ctrl_local_id;
        return lspEntry;
      });
    } else {
      return [];
    }
  }

  // rpc add lsppe
  private async addLsppeByRpc(rpc: RpcClient, lsppe: LsppeEntry): Promise<any> {
    return await rpc.lsppe.add(lsppe.getObj());
  }

  // rpc del lsppe
  private async delLsppeByRpc(rpc: RpcClient, lsppe: string): Promise<any> {
    return await rpc.lsppe.del({
      key: {
        name: lsppe
      }
    });
  }

  // dut getall lsppe
  private async getLsppesFromDut(dut: Dut): Promise<Array<LsppeEntry>> {
    const output = await dut.exec`
      > show running-config
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
        return /mpls\slsp-pe.*?\s+/g.test(ele);
      })
      .map(lsppe => {
        return lsppe.split(/\s/g);
      });

    if (output_arr_format.length > 0) {
      return output_arr_format.map(lsppe_ele_arr => {
        if (lsppe_ele_arr[1] === "lsp-pe") {
          const key = new CommonKey(lsppe_ele_arr[2]);
          const lsppe = new LsppeEntry(key);

          for (let i = 3; i < lsppe_ele_arr.length; i++) {
            switch (lsppe_ele_arr[i]) {
              case "inlabel":
                lsppe.inLabel = parseInt(lsppe_ele_arr[++i]);
                break;
              case "outlabel":
                lsppe.outLabel = parseInt(lsppe_ele_arr[++i]);
                ipToNumber(lsppe_ele_arr[++i]).then(result => {
                  lsppe.nexthopIp = result;
                });
                break;
            }
          }
          return lsppe;
        }
      });
    } else {
      return [];
    }
  }

  // dut add lsppe
  private async addLsppeByDut(dut: Dut, lspEntry: LsppeEntry) {
    const ip = await numberToIp(lspEntry.nexthopIp);
    await dut.exec`
      > configure terminal
      > mpls lsp-pe ${lspEntry.key.name}
      > inlabel ${lspEntry.inLabel}
      > outlabel ${lspEntry.outLabel} ${ip}
      > end
    `;
  }

  // dut del lsppe
  private async delLsppeByDut(dut: Dut, lsppeName: string) {
    await dut.exec`
      > configure terminal
      > no mpls lsp-pe ${lsppeName}
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
