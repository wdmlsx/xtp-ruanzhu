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

/*
 * @Describe注解用于描述该测试用例所测试的功能
 * 该文字描述会在脚本执行完毕后在终端输出，也会记录到测试报告中，方便用户查看
 * */
@Describe(
  "R-MIRROR-4-0020 test Mirror destination port should be physical interface and only physical interface can become mirror destination port. The interface type can be layer2 or layer3."
)
class TestMirrorDstPort {
  private dstPort: string;

  /*
   * @Before注解会在所有@Test注解的测试方法前运行，
   * 只运行一次
   * 用于初始化一些数据
   * */
  @BeforeAll
  private init() {
    this.dstPort = this.topo.port[0];
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

  @Test("test config l2")
  private async testL2() {
    let sessionId = await this.addMonitorSession(1, this.dstPort);
    try {
      let output = await this.output(sessionId);

      expect(output).toMatch(this.dstPort);
    } finally {
      await this.removeSession(sessionId);
    }
  }

  @Test("test config l3")
  private async testL3() {
    await this.changeToL3(this.dstPort);
    let sessionId = await this.addMonitorSession(1, this.dstPort);
    try {
      let output = await this.output(sessionId);

      expect(output).toMatch(this.dstPort);
    } finally {
      await this.removeSession(sessionId);

      await this.resetToL2(this.dstPort);
    }
  }

  private async addMonitorSession(
    sessionId: number,
    porName: string
  ): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > monitor session ${sessionId} destination interface ${porName}
      > end 
    `;
    return sessionId;
  }

  private async removeSession(sessionId: number) {
    await this.topo.dut.exec`
      > configure terminal
      > no monitor session ${sessionId}
      > end
    `;
  }

  private async changeToL3(portName: string) {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > no switchport
      > end
    `;
  }

  private async resetToL2(portName: string) {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > switchport
      > end
    `;
  }

  private async output(sessionId: number): Promise<string> {
    return await this.topo.dut.exec`
      > show monitor session ${sessionId}
    `;
  }
}
