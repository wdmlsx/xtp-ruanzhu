import {
  AfterEach,
  BeforeAll,
  BeforeEach,
  Describe,
  InjectTopo,
  Test
} from "../../../decorators";

import { DoubleDevice } from "../../../topos/double-device";
import { RpcClient } from "@xtp/grpc";
import { Dut } from "@xtp/telnet";
import { ipToNumber, numberToIp } from "../../../utils";
import { FilterClassEntry } from "../mpls/FilterClassEntry";

/*
 * @Describe注解用于描述该测试用例所测试的功能
 * 该文字描述会在脚本执行完毕后在终端输出，也会记录到测试报告中，方便用户查看
 * */
@Describe("test filter class")
class FilterClassTest {
  /*
   * @InjectTopo 注解用于给该测试类注入拓扑
   * 初始化该类时注入虚拟拓扑
   * */
  @InjectTopo
  private readonly topo: DoubleDevice;

  private dut1: Dut;

  private rpc_dut1: RpcClient;

  /*
   * 从拓扑中获取设备并进行链接
   * 每个测试例被执行前都将执行该方法，链接设备
   * @BeforeEach　注解会在每一个　@Test注解的测试方法执行前运行
   * */
  @BeforeEach
  private async beforeEach() {
    await this.dut1.connect();
  }

  /*
   * 每个测试用例跑完都断开设备连接
   * 因为每台设备允许的telnet最多链接数是有限的
   * @AfterEach　注解会在每一个　@Test注解的测试方法执行后执行
   * */
  @AfterEach
  private async afterEach() {
    await this.dut1.end();
  }

  /*
   * @BeforeAll注解会在所有@Test注解的测试方法前运行，
   * 只运行一次
   * 用于初始化一些数据
   * */
  @BeforeAll
  private async init() {
    this.dut1 = this.topo.dut1.cli;

    this.rpc_dut1 = this.topo.dut1.rpc;
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test add a filter-class", 30000)
  private async testAddFC() {
    const fcEntry = new FilterClassEntry("fc_rpc");
    fcEntry.srcMac = "bb:bb:00:ba:ff:3a";
    fcEntry.dstMac = "bb:bb:00:32:ff:3b";
    fcEntry.vlan = 100; // 1-4094
    fcEntry.cos = 1; // 2-9
    fcEntry.etherType = 2048;
    fcEntry.srcIp = await ipToNumber("1.1.1.1");
    fcEntry.srcIpMaskLen = 24;
    fcEntry.dstIp = await ipToNumber("2.2.2.2");
    fcEntry.dstIpMaskLen = 24;
    fcEntry.dscp = 1; // 2-65
    fcEntry.protocol = 21; // UDP, 6 TCP 21
    fcEntry.srcPort = 9527; // TCP PORT
    fcEntry.dstPort = 8080; // TCP PORT
    try {
      const resp = await this.addFCByRpc(this.rpc_dut1, fcEntry);
      if (resp.return_code === 0) {
        const filterClassEntries = await this.getAllFcFromDut(this.dut1);
        const fcEntry_got = filterClassEntries.filter(fcEntry_got =>
          fcEntry_got.compareTo(fcEntry)
        );
        expect(fcEntry_got.length).toEqual(1);
      } else {
        expect(resp.return_code).toEqual(0);
      }
    } finally {
      await this.delFCByDut(this.dut1, fcEntry);
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test get all filter-class")
  private async testGetAll() {
    const fcEntry_01 = new FilterClassEntry("fc_dut_01");
    fcEntry_01.srcMac = "33:22:11:00:55:66";
    fcEntry_01.dstMac = "11:22:33:44:55:66";
    fcEntry_01.cos = 2;
    fcEntry_01.dscp = 1;

    const fcEntry_02 = new FilterClassEntry("fc_dut_02");
    fcEntry_02.etherType = 2048;
    fcEntry_02.srcIp = await ipToNumber("11.11.11.11");
    fcEntry_02.srcIpMaskLen = 26;
    fcEntry_02.dstIp = await ipToNumber("22.22.22.22");
    fcEntry_02.dstIpMaskLen = 26;

    try {
      await this.addFCByDut(this.dut1, fcEntry_01);
      await this.addFCByDut(this.dut1, fcEntry_02);

      const fcEntries = await this.getAllFcFromRpc(this.rpc_dut1, {
        start: 0,
        end: 0
      });
      if (fcEntries.length > 0) {
        const fcEntries_got = fcEntries.filter(
          fcEntry =>
            fcEntry.compareTo(fcEntry_01) || fcEntry.compareTo(fcEntry_02)
        );
        expect(fcEntries_got.length).toEqual(2);
      } else {
        expect(fcEntries.length).not.toEqual(0);
      }
    } finally {
      await this.delFCByDut(this.dut1, fcEntry_01);
      await this.delFCByDut(this.dut1, fcEntry_02);
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test delete filter-class")
  private async testDelete() {
    const fcEntry_01 = new FilterClassEntry("fc_dut_01");
    fcEntry_01.srcMac = "33:22:11:00:55:66";
    fcEntry_01.dstMac = "11:22:33:44:55:66";
    fcEntry_01.cos = 2;
    fcEntry_01.dscp = 1;
    try {
      await this.addFCByDut(this.dut1, fcEntry_01);
      const resp = await this.delFCByRpc(this.rpc_dut1, fcEntry_01);
      if (resp.return_code === 0) {
        const fcEntries = await this.getAllFcFromDut(this.dut1);
        const fcEntries_got = fcEntries.filter(fcEntry =>
          fcEntry.compareTo(fcEntry_01)
        );
        expect(fcEntries_got.length).toEqual(0);
      } else {
        expect(resp.return_code).toEqual(0);
      }
    } finally {
      //
    }
  }

  // ======================================================================== //
  // rpc get all filter class
  private async getAllFcFromRpc(
    rpc: RpcClient,
    range: Object
  ): Promise<Array<FilterClassEntry>> {
    const filterClassArr: Array<FilterClassEntry> = [];
    const resp = await rpc.filter_class.getall(range);

    if (resp.return_code === 0 && resp.data.length > 0) {
      const fcArr = resp.data;
      for (let fcEle of fcArr) {
        const fc = new FilterClassEntry(fcEle.name);
        fc.srcMac = fcEle.src_mac;
        fc.dstMac = fcEle.dst_mac;
        fc.vlan = fcEle.vlan;
        // fc.cos = fcEle.cos === 0 ? fcEle.cos : fcEle.cos - 1;
        fc.cos = fcEle.cos;
        fc.etherType = fcEle.ether_type;
        fc.srcIp = fcEle.src_ip;
        fc.srcIpMaskLen = fcEle.src_ip_mask_len;
        fc.dstIp = fcEle.dst_ip;
        fc.dstIpMaskLen = fcEle.dst_ip_mask_len;
        // fc.dscp = fcEle.dscp === 0 ? 0 : fcEle.dscp - 1;
        fc.dscp = fcEle.dscp;
        fc.protocol = fcEle.protocol;
        fc.srcPort = fcEle.src_port;
        fc.dstPort = fcEle.dst_port;

        filterClassArr.push(fc);
      }
    }
    return filterClassArr;
  }

  // rpc add filter class
  private async addFCByRpc(rpc: RpcClient, fc: FilterClassEntry): Promise<any> {
    return await rpc.filter_class.add(fc.getFilterClass());
  }

  // rpc delete filter class
  private async delFCByRpc(rpc: RpcClient, fc: FilterClassEntry): Promise<any> {
    return await rpc.filter_class.del({ name: fc.name });
  }

  // dut get all filter class
  private async getAllFcFromDut(dut: Dut): Promise<Array<FilterClassEntry>> {
    const output = await dut.exec`
      > show running-config
    `;

    let output_arr = output
      .replace(/\r\n/g, " ")
      .replace(/\u001b\[\d*\w/g, "")
      .split("!");

    let mpls_fc = output_arr
      .map(ele => {
        return ele
          .replace(/[\r\n]+/g, "")
          .replace(/\s{2,}/g, " ")
          .trim();
      })
      .filter(ele => {
        return /mpls\sfilter-class.*?\s+/g.test(ele);
      })
      .map(fc => {
        return fc.split(/\s/g);
      });

    if (mpls_fc.length > 0) {
      return mpls_fc
        .map(fcArr => {
          if (fcArr[1] === "filter-class") {
            const fc = new FilterClassEntry(fcArr[2]);
            for (let i = 2; i < fcArr.length; i++) {
              switch (fcArr[i]) {
                case "src-mac":
                  fc.srcMac = FilterClassTest.formatDutMac(fcArr[++i]);
                  break;
                case "dst-mac":
                  fc.dstMac = FilterClassTest.formatDutMac(fcArr[++i]);
                  break;
                case "vlan":
                  fc.vlan = parseInt(fcArr[++i]);
                  break;
                case "cos":
                  fc.cos = parseInt(fcArr[++i]) + 1;
                  break;
                case "ether-type":
                  fc.etherType = parseInt(fcArr[++i]);
                  break;
                case "src-ip":
                  const srcIpAndMask = fcArr[++i].split("/");
                  ipToNumber(srcIpAndMask[0]).then(result => {
                    fc.srcIp = result;
                  });
                  fc.srcIpMaskLen = parseInt(srcIpAndMask[1]);
                  break;
                case "dst-ip":
                  let dstipAndMask = fcArr[++i].split("/");
                  ipToNumber(dstipAndMask[0]).then(result => {
                    fc.dstIp = result;
                  });
                  fc.dstIpMaskLen = parseInt(dstipAndMask[1]);
                  break;
                case "dscp":
                  fc.dscp = parseInt(fcArr[++i]) + 1;
                  break;
                case "protocol":
                  fc.protocol = parseInt(fcArr[++i]);
                  break;
                case "src-port":
                  fc.srcPort = parseInt(fcArr[++i]);
                  break;
                case "dst-port":
                  fc.dstPort = parseInt(fcArr[++i]);
                  break;
              }
            }
            return fc;
          }
        })
        .filter(fc => fc !== null);
    } else {
      return [];
    }
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
    if (fc.srcMac !== "")
      cmd += ` src-mac ${FilterClassTest.formatMacParm(fc.srcMac)}`;
    if (fc.dstMac !== "")
      cmd += ` dst-mac ${FilterClassTest.formatMacParm(fc.dstMac)}`;
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

  private static formatDutMac(mac: string): string {
    if (mac.split(/\./).length === 3) {
      return mac
        .split(/\./)
        .map(ele => {
          return ele
            .match(/[a-fA-F0-9]{2}/g)
            .reduce((pre, cur) => pre + ":" + cur);
        })
        .reduce((pre, cur) => pre + ":" + cur);
    } else {
      return "";
    }
  }

  private static formatMacParm(mac: string): string {
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
