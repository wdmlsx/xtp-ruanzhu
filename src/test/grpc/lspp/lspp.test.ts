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
import { LsppEntry } from "../mpls/LsppEntry";
import { CommonKey } from "../mpls/CommonKey";

/*
 * @Describe注解用于描述该测试用例所测试的功能
 * 该文字描述会在脚本执行完毕后在终端输出，也会记录到测试报告中，方便用户查看
 * */
@Describe("test lspp")
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
    await this.dut2.connect();
  }

  /*
   * 每个测试用例跑完都断开设备连接
   * 因为每台设备允许的telnet最多链接数是有限的
   * @AfterEach　注解会在每一个　@Test注解的测试方法执行后执行
   * */
  @AfterEach
  private async afterEach() {
    await this.dut1.end();
    await this.dut2.end();
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

    this.rpc_dut1 = this.topo.dut1.rpc;
    this.rpc_dut2 = this.topo.dut2.rpc;

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
  @Test("test add lspp")
  private async testAddLspp() {
    const key = new CommonKey("lspp_dut1_17");

    const lspEntry_dut1 = new LsppEntry(key);
    lspEntry_dut1.inlabelEast = 5000;
    lspEntry_dut1.outlabelEast = 5001;
    lspEntry_dut1.nexthopIpEast = this.ip_dut2_13_num;
    lspEntry_dut1.outlabelWest = 5000;
    lspEntry_dut1.inlabelWest = 5001;
    lspEntry_dut1.nexthopIpWest = this.ip_dut2_15_num;

    try {
      // rpc add lspp
      const resp = await this.addLsppByRpc(this.rpc_dut1, lspEntry_dut1);

      if (resp.rurn_code === 0) {
        const lspp_got = await this.getLsppFromDut(this.dut1);

        const lspp_target = lspp_got.filter(lspp =>
          lspp.compareTo(lspEntry_dut1)
        );

        expect(lspp_target.length).toEqual(1);
      } else {
        expect(resp.return_code).toEqual(0);
      }
    } finally {
      await this.delLsppByDut(this.dut1, lspEntry_dut1);
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test delete lspp")
  private async testDelLspp() {
    const key = new CommonKey("lspp_dut1_17");

    const lspEntry_dut1 = new LsppEntry(key);
    lspEntry_dut1.inlabelEast = 5000;
    lspEntry_dut1.outlabelEast = 5001;
    lspEntry_dut1.nexthopIpEast = this.ip_dut2_13_num;
    lspEntry_dut1.outlabelWest = 5000;
    lspEntry_dut1.inlabelWest = 5001;
    lspEntry_dut1.nexthopIpWest = this.ip_dut2_15_num;

    try {
      //dut add lspp
      await this.addLsppByDut(this.dut1, lspEntry_dut1);

      const resp = await this.delLsppByRpc(this.rpc_dut1, lspEntry_dut1);

      if (resp.return_code === 0) {
        const lspp_got = await this.getLsppFromDut(this.dut1);
        const lspp_target = lspp_got.filter(lspp =>
          lspp.compareTo(lspEntry_dut1)
        );

        expect(lspp_target.length).toEqual(0);
      } else {
        expect(resp.return_code).toEqual(0);
      }
    } finally {
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test get all lspp ")
  private async testGetAllLspp() {
    const key1 = new CommonKey("lspp_dut1_17");

    const lspEntry_dut1 = new LsppEntry(key1);
    lspEntry_dut1.inlabelEast = 5000;
    lspEntry_dut1.outlabelEast = 5000;
    lspEntry_dut1.nexthopIpEast = this.ip_dut2_13_num;
    lspEntry_dut1.outlabelWest = 5001;
    lspEntry_dut1.inlabelWest = 5001;
    lspEntry_dut1.nexthopIpWest = this.ip_dut2_15_num;

    const key2 = new CommonKey("lspp_dut1_15");
    //
    const lspEntry_dut2 = new LsppEntry(key2);
    lspEntry_dut2.inlabelEast = 4000;
    lspEntry_dut2.outlabelEast = 4000;
    lspEntry_dut2.nexthopIpEast = this.ip_dut2_13_num;
    lspEntry_dut2.outlabelWest = 4001;
    lspEntry_dut2.inlabelWest = 4001;
    lspEntry_dut2.nexthopIpWest = this.ip_dut2_17_num;

    const key3 = new CommonKey("lspp_dut1_13");

    const lspEntry_dut3 = new LsppEntry(key3);

    try {
      //dut add lspp
      await this.addLsppByDut(this.dut1, lspEntry_dut1);
      await this.addLsppByDut(this.dut1, lspEntry_dut2);
      await this.addLsppByDut(this.dut1, lspEntry_dut3);

      const resp = await this.getAllLsppFromRpc(this.rpc_dut1, {
        start: 0,
        end: 0
      });

      if (resp.length > 0) {
        const lspp_got = await this.getLsppFromDut(this.dut1);

        const lspp_target = lspp_got.filter(lspp_got => {
          return (
            lspp_got.compareTo(lspEntry_dut1) ||
            lspp_got.compareTo(lspEntry_dut2) ||
            lspp_got.compareTo(lspEntry_dut3)
          );
        });

        expect(lspp_target.length).toEqual(3);
      } else {
        expect(resp.length).not.toEqual(0);
      }
    } finally {
      await this.delLsppByDut(this.dut1, lspEntry_dut1);
      await this.delLsppByDut(this.dut1, lspEntry_dut2);
      await this.delLsppByDut(this.dut1, lspEntry_dut3);
    }
  }

  // rpc getall lspp
  private async getAllLsppFromRpc(
    rpc: RpcClient,
    range: Object
  ): Promise<Array<LsppEntry>> {
    const resp = await rpc.lspp.getall(range);
    if (resp.return_code === 0) {
      return resp.data.map(lspp => {
        const key = new CommonKey(lspp.key.name);
        const lsppEntry = new LsppEntry(key);
        lsppEntry.inlabelEast = lspp.inlabel_east;
        lsppEntry.inlabelWest = lspp.inlabel_west;
        lsppEntry.outlabelEast = lspp.outlabel_east;
        lsppEntry.outlabelWest = lspp.outlabel_west;
        lsppEntry.nexthopIpWest = lspp.nexthop_ip_west;
        lsppEntry.nexthopIpEast = lspp.nexthop_ip_west;
        return lsppEntry;
      });
    } else {
      return [];
    }
  }

  // rpc add lspp
  private async addLsppByRpc(rpc: RpcClient, lspp: LsppEntry): Promise<any> {
    return await rpc.lspp.add(lspp.getObj());
  }

  // rpc del lspp
  private async delLsppByRpc(rpc: RpcClient, lspp: LsppEntry): Promise<any> {
    return await rpc.lspp.del({ key: lspp.key.getKey() });
  }

  // dut add lspp
  private async addLsppByDut(dut: Dut, lspp: LsppEntry) {
    const ip_east = lspp.inlabelEast ? await numberToIp(lspp.nexthopIpEast) : 0;
    const ip_west = lspp.inlabelWest ? await numberToIp(lspp.nexthopIpWest) : 0;
    await dut.exec`
      > configure terminal
      > mpls lsp-p ${lspp.key.name}
    `;
    if (lspp.inlabelEast !== 0) {
      await dut.exec`
        > inlabel-east ${lspp.inlabelEast} outlabel ${lspp.outlabelEast} ${ip_east}
      `;
    }
    if (lspp.inlabelWest !== 0) {
      await dut.exec`
        > inlabel-west ${lspp.inlabelWest} outlabel ${lspp.outlabelWest} ${ip_west}
      `;
    }
    await dut.exec`
      > end
    `;
  }

  // dut getall lspp
  private async getLsppFromDut(dut: Dut): Promise<Array<LsppEntry>> {
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
        return /mpls\slsp-p.*?\s+/g.test(ele);
      })
      .map(lsppe => {
        return lsppe.split(/\s/g);
      })
      .filter(lspp_arr => lspp_arr[1] === "lsp-p");

    if (output_arr_format.length > 0) {
      return await Promise.all(
        output_arr_format.map(async lspp_arr => {
          const key = new CommonKey(lspp_arr[2]);
          const lsppEntry = new LsppEntry(key);
          for (let i = 0; i < lspp_arr.length; i++) {
            switch (lspp_arr[i]) {
              case "inlabel-east":
                lsppEntry.inlabelEast = parseInt(lspp_arr[++i]);
                i++;
                lsppEntry.outlabelEast = parseInt(lspp_arr[++i]);
                lsppEntry.nexthopIpEast = await ipToNumber(lspp_arr[++i]);
                break;
              case "inlabel-west":
                lsppEntry.inlabelWest = parseInt(lspp_arr[++i]);
                i++;
                lsppEntry.outlabelWest = parseInt(lspp_arr[++i]);
                lsppEntry.nexthopIpWest = await ipToNumber(lspp_arr[++i]);
                break;
            }
          }
          return lsppEntry;
        })
      );
    } else {
      return [];
    }
  }

  // dut del lspp
  private async delLsppByDut(dut: Dut, lspp: LsppEntry) {
    await dut.exec`
      > configure terminal
      > no mpls lsp-p ${lspp.key.name}
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
      > no ip address
      > no label-switching
      > end
    `;
  }
}
