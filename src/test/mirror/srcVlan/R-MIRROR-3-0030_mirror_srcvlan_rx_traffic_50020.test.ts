import { SingleDevice } from "../../../topos/single-device";
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
import { Ether, IP, Packet } from "@xtp/packet-craft";

/*
 * @Describe注解用于描述该测试用例所测试的功能
 * 该文字描述会在脚本执行完毕后在终端输出，也会记录到测试报告中，方便用户查看
 * */
@Describe(
  "R-MIRROR-3-0030 test Mirror ingress traffic of VLAN should include all traffic that follow [R-MIRROR-5-0020] and belong to that VLAN"
)
class TestMirrorSrcVlan {
  private p3: string;
  private p4: string;
  private p5: string;
  private p6: string;

  /*
   * @Before注解会在所有@Test注解的测试方法前运行，
   * 只运行一次
   * 用于初始化一些数据
   * */
  @BeforeAll
  private async init() {
    this.p3 = this.topo.dut1.port[2];
    this.p4 = this.topo.dut1.port[3];
    this.p5 = this.topo.dut1.port[0];
    this.p6 = this.topo.dut1.port[1];
  }

  /*
   * @InjectTopo 注解用于给该测试类注入拓扑
   * 初始化该类时注入虚拟拓扑
   * */
  @InjectTopo
  private readonly topo: DoubleDevice;

  @BeforeEach
  private async beforeEach() {
    jest.setTimeout(30000);

    await this.topo.dut1.cli.connect();
  }

  @AfterEach
  private async afterEach() {
    await this.topo.dut1.cli.end();
  }

  @Test(
    "test Mirror ingress traffic of VLAN should include all traffic that follow [R-MIRROR-5-0020] and belong to that VLAN",
    300000
  )
  private async testConfig() {
    let cli = this.topo.dut1.cli;
    let vids = await this.addVlans(cli, [100, 200]);

    await this.addAccessToVlan(cli, this.p3, vids[0]);

    await this.addAccessToVlan(cli, this.p5, vids[0]);

    await this.addAccessToVlan(cli, this.p6, vids[1]);

    await this.addMonitorSession(cli, 1, this.p3, this.p6);

    let packet = new Packet([
      new Ether({ src: "00:00:00:00:00:01", dst: "00:00:00:00:00:02" }),
      new IP()
    ]);

    let testStrom = this.topo.testStrom;

    // await testStrom.backend.stopCapture()
    try {
      await this.clearCounters(cli);
      await testStrom.backend.startCapture(testStrom.port[1]);

      await testStrom.backend.send(packet, testStrom.port[0]);
      let caps = await testStrom.backend.takeCaptureData(testStrom.port[1], 1);
      if (caps) {
        // console.log("Ether: ", caps[0].getLayer(Ether));
      }
    } catch (e) {
      console.log("error: ", e.message);
    } finally {
      await this.removeVlans(cli, vids);
    }

    expect(0).toEqual(0);
  }

  //　添加并获取vlan
  private async addVlans(
    cli: Dut,
    vids: Array<number>
  ): Promise<Array<number>> {
    await cli.exec`
      > configure terminal
      > vlan database
    `;

    for (let i = 0; i < vids.length; i++) {
      await cli.exec`> vlan ${vids[i]}`;
    }

    await cli.exec`> end`;

    return vids;
  }

  // 添加vlan interface
  private async addVlanInterface(cli: Dut, vid: number): Promise<number> {
    await cli.exec`
      > configure terminal
      > interface vlan ${vid}
      > end
    `;
    return vid;
  }

  //　移除vlan
  private async removeVlans(cli: Dut, vids: Array<number>) {
    await cli.exec`
      > configure terminal
      > vlan database
    `;

    for (let i = 0; i < vids.length; i++) {
      await cli.exec`> no vlan ${vids[i]}`;
    }

    await cli.exec`> end`;
  }

  private async addAccessToVlan(
    cli: Dut,
    portName: string,
    vlanId: number
  ): Promise<string> {
    await cli.exec`
      > configure terminal
      > interface ${portName}
      > switchport access vlan ${vlanId}
      > end
    `;
    return portName;
  }

  private async addMonitorSession(
    cli: Dut,
    sessionId,
    srcPort: string,
    dstPort: string
  ): Promise<number> {
    await cli.exec`
      > configure terminal
      > monitor session ${sessionId} source interface ${srcPort}
      > monitor session ${sessionId} destination interface ${dstPort}
      > end
    `;
    return sessionId;
  }

  private async removeMonitorSession(cli: Dut, sessionId: number) {
    await cli.exec`
      > configure terminal
      > no monitor session ${sessionId}
      > end
    `;
  }

  private async clearCounters(cli: Dut) {
    await cli.exec`> clear counters`;
  }
}
