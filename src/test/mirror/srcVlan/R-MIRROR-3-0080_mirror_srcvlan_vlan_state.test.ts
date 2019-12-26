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
import { Dot1Q, Ether, IP, Packet } from "@xtp/packet-craft";

/*
 * @Describe注解用于描述该测试用例所测试的功能
 * 该文字描述会在脚本执行完毕后在终端输出，也会记录到测试报告中，方便用户查看
 * */
@Describe(
  "R-MIRROR-3-0080 test The ingress traffic that follows [R-MIRROR-5-0020] will not be affect whether the vlan state is enabled or disabled. The egress traffic that follows [R-MIRROR-5-0030] can not be mirrored if the vlan state is disabled."
)
class TestMirrorSrcVlan {
  private srcPort: string;
  private dstPort: string;

  /*
   * @Before注解会在所有@Test注解的测试方法前运行，
   * 只运行一次
   * 用于初始化一些数据
   * */
  @BeforeAll
  private async init() {
    this.srcPort = this.topo.port[0];
    this.dstPort = this.topo.port[1];
  }

  /*
   * @InjectTopo 注解用于给该测试类注入拓扑
   * 初始化该类时注入虚拟拓扑
   * */
  @InjectTopo
  private readonly topo: SingleDevice;

  @BeforeEach
  private async beforeEach() {
    jest.setTimeout(30000);

    await this.topo.dut.connect();
  }

  @AfterEach
  private async afterEach() {
    await this.topo.dut.end();
  }

  @Test("test disabled vlan.")
  private async testConfig() {
    let vPort = await this.addVlanInterface(100);

    let dvid = await this.addVlan(200);

    await this.addAccessToVlan(dvid, this.dstPort);
    // await this.addAccessToVlan(vPort, this.srcPort);

    let sessionId = await this.addMonitorSession(1, vPort, this.dstPort);

    let packet = new Packet([
      new Ether({ src: "00:00:00:00:00:05", dst: "00:00:00:00:00:03" }),
      new IP()
    ]);

    let testStrom = this.topo.testStrom;

    await testStrom.backend.stopCapture(testStrom.port[1]);

    await this.clearCounters(this.dstPort);

    await this.clearCounters(this.srcPort);

    await testStrom.backend.startCapture(testStrom.port[1]);

    try {
      await testStrom.backend.send(packet, testStrom.port[0]);
      //
      let caps = await testStrom.backend.takeCaptureData(testStrom.port[1], 1);

      if (caps) {
        expect(caps[0].getLayer(Ether).fields).toMatchObject({
          src: "00:00:00:00:00:05",
          dst: "00:00:00:00:00:03"
        });
        // console.log("Ether: ", caps[0].getLayer(Ether));
        // console.log("Dot1Q: ", caps[0].getLayer(Dot1Q));
        // console.log("IP: ", caps[0].getLayer(IP));
      }
    } catch (e) {
      console.log("error: ", e.message);
    } finally {
      await testStrom.backend.stopCapture(testStrom.port[1]);
      await this.removeSession(sessionId);
      await this.removeVlan(vPort);
      await this.removeVlan(dvid);
    }
  }

  //
  private async removeSession(sessionId: number) {
    await this.topo.dut.exec`
      > configure terminal
      > no monitor session ${sessionId}
      > end
    `;
  }

  private async removeVlan(vlanId: number) {
    await this.topo.dut.exec`
      > configure terminal
      > vlan database
      > no vlan ${vlanId}
      > end
    `;
  }

  private async output(sessionId: number): Promise<string> {
    return await this.topo.dut.exec`
      > show monitor session ${sessionId}
    `;
  }

  private async addMonitorSession(
    sessionId: number,
    vlanId: number,
    dstPort: string
  ): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > monitor session ${sessionId} source vlan ${vlanId}
      > monitor session ${sessionId} destination interface ${dstPort}
      > end
    `;

    return sessionId;
  }

  private async addVlanInterface(vlanId: number): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > vlan database
      > vlan 100 state disable
      > exit
      > interface vlan 100
      > end
    `;

    return vlanId;
  }

  private async addVlan(vid: number): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > vlan database
      > vlan ${vid}
      > end
    `;
    return vid;
  }

  private async addAccessToVlan(vid: number, portName: string) {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > switchport access vlan ${vid}
      > end
    `;
  }
  private async clearCounters(portName: string) {
    await this.topo.dut.exec`> clear counters ${portName}`;
  }
}
