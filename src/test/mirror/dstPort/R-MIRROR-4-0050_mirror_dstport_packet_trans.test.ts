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
import { Ether, Packet, IP } from "@xtp/packet-craft";

/*
 * @Describe注解用于描述该测试用例所测试的功能
 * 该文字描述会在脚本执行完毕后在终端输出，也会记录到测试报告中，方便用户查看
 * */
@Describe(
  "R-MIRROR-4-0050 test Only mirroring packets can be transmitted by destination port."
)
class TestMirrorSrcPort {
  private srcPort: string;
  private dstPort: string;

  /*
   * @Before注解会在所有@Test注解的测试方法前运行，
   * 只运行一次
   * 用于初始化一些数据
   * */
  @BeforeAll
  private init() {
    this.srcPort = this.topo.port[0];
    this.dstPort = this.topo.port[1];
  }

  /*
   * @InjectTopo 注解用于给该测试类注入拓扑
   * 初始化该类时注入虚拟拓扑
   * */
  @InjectTopo
  private readonly topo: SingleDevice;

  /*
   * 从拓扑中获取设备并进行链接
   * 每个测试例被执行前都将执行该方法，链接设备
   * @BeforeEach　注解会在每一个　@Test注解的测试方法执行前运行
   * */
  @BeforeEach
  private async beforeEach() {
    jest.setTimeout(30000);

    await this.topo.dut.connect();
  }

  /*
   * 每个测试用例跑完都断开设备连接
   * 因为每台设备允许的telnet最多链接数是有限的
   * @AfterEach　注解会在每一个　@Test注解的测试方法执行后执行
   * */
  @AfterEach
  private async afterEach() {
    await this.topo.dut.end();
  }

  @Test(
    "test not mirrored packet can not transmitted by destination port",
    300000
  )
  private async testConfig() {
    let vids = await this.getVlan([100, 200]);

    await this.addAccessToVlan(this.srcPort, vids[0]);

    await this.addAccessToVlan(this.dstPort, vids[1]);

    // let sessionId = await this.getMirrorSession(this.srcPort, this.dstPort);

    const srcMac = "00:00:00:00:00:01";
    const dstMac = "00:00:00:00:00:02";

    let testStrom = this.topo.testStrom;

    await this.clearCounters();

    await testStrom.backend.stopCapture(testStrom.port[1]);

    // 组包
    let packet = new Packet([
      new Ether({ src: srcMac, dst: dstMac }),
      new IP()
    ]);

    await this.topo.dut.exec`> clear counters`;

    // 抓包
    await testStrom.backend.startCapture(testStrom.port[1]);

    //发包
    await testStrom.backend.send(packet, testStrom.port[0]);

    let hasError = false;
    try {
      await testStrom.backend.takeCaptureData(testStrom.port[1], 1);
    } catch (e) {
      // console.log("error: ", e.message);
      hasError = true;
    } finally {
      await testStrom.backend.stopCapture(testStrom.port[1]);
      // await this.removeSession(sessionId);
      await this.removeVlan(vids);
    }
    expect(hasError).toBeTruthy();
  }

  //　添加并获取vlan
  private async getVlan(vids: Array<number>): Promise<Array<number>> {
    await this.topo.dut.exec`
      > configure terminal
      > vlan database
    `;

    for (let i = 0; i < vids.length; i++) {
      await this.topo.dut.exec`> vlan ${vids[i]}`;
    }

    await this.topo.dut.exec`> end`;

    return vids;
  }

  //　移除vlan
  private async removeVlan(vids: Array<number>) {
    await this.topo.dut.exec`
      > configure terminal
      > vlan database
    `;

    for (let i = 0; i < vids.length; i++) {
      await this.topo.dut.exec`> no vlan ${vids[i]}`;
    }

    await this.topo.dut.exec`> end`;
  }

  // 端口镜像配置
  private async getMirrorSession(srcPort: string, dstPort): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > monitor session 1 source interface ${srcPort}
      > monitor session 1 destination interface ${dstPort}
      > end
    `;
    return 1;
  }

  private async removeSession(sessionId: number) {
    await this.topo.dut.exec`
      > configure terminal
      > no monitor session ${sessionId}
      > end
    `;
  }

  private async addAccessToVlan(
    portName: string,
    vid: number
  ): Promise<string> {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > switchport access vlan ${vid}
      > end
    `;
    return portName;
  }

  private async addTrunkToVlan(portName: string, vid: number): Promise<string> {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > switchport trunk allowed vlan add ${vid}
      > end
    `;
    return portName;
  }

  private async changeAcToTrunk(portName: string): Promise<string> {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > switchport mode trunk
      > end
    `;
    return portName;
  }

  private async changeTrunkToAc(portName: string): Promise<string> {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > switchport mode access
      > end
    `;
    return portName;
  }

  private async clearCounters() {
    await this.topo.dut.exec`> clear counters`;
  }
}
