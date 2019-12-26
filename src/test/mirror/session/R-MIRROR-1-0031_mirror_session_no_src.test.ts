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
import { Ether, IP, Packet } from "@xtp/packet-craft";

/*
 * @Describe注解用于描述该测试用例所测试的功能
 * 该文字描述会在脚本执行完毕后在终端输出，也会记录到测试报告中，方便用户查看
 * */
@Describe(
  "R-MIRROR-1-0031 test Mirror session should remain inactive if the destination port isn’t up"
)
class TestMirrorSession {
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
    this.dstPort = this.topo.port[2];
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

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test packet received monitor", 300000)
  private async testConfig() {
    let vids = await this.getVlan([100, 200]);

    await this.addAccessToVlan(this.srcPort, vids[0]);

    await this.addAccessToVlan(this.dstPort, vids[1]);

    let sessionId = await this.getMirrorSession(this.srcPort, this.dstPort);

    const srcMac = "00:00:00:00:00:01";
    const dstMac = "00:00:00:00:00:02";

    let testStrom = this.topo.testStrom;

    // 组包
    let packet = new Packet([
      new Ether({ src: srcMac, dst: dstMac }),
      new IP()
    ]);

    await this.topo.dut.exec`> clear counters`;
    //发包
    await testStrom.backend.send(packet, testStrom.port[0]);

    try {
      let output = await this.topo.dut.exec`> show interface ${this.dstPort}`;
      let rx = output.match(/0+\s+packets\sinput/g);
      let tx = output.match(/0+\s+packets\s+output/g);
      expect(rx).not.toBeNull();
      expect(tx).not.toBeNull();
    } catch (e) {
      console.log("error: ", e.message);
    } finally {
      await this.removeSession(sessionId);
      await this.removeVlan(vids);
    }
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
