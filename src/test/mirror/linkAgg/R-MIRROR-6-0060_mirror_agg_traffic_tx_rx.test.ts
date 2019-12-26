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
  "R-MIRROR-6-0060 test Traffic of mirror source aggregator should include ingress traffic of aggregator and egress traffic of aggregator."
)
class TestMirrorSession {
  private portName1: string;
  private portName2: string;

  /*
   * @Before注解会在所有@Test注解的测试方法前运行，
   * 只运行一次
   * 用于初始化一些数据
   * */
  @BeforeAll
  private init() {
    this.portName1 = this.topo.port[5];
    this.portName2 = this.topo.port[6];
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

  @Test("test traffic of mirror source with ingress")
  private async testIngress() {
    let aggId = await this.addAgg(this.portName1, 1);

    let sessionId = await this.addSrcMonitorSessionRX(1, aggId);

    try {
      let output = await this.output(sessionId);

      expect(output).toMatch("agg" + aggId);
    } finally {
      await this.removeSession(sessionId);

      await this.removeAgg(this.portName1);
    }
  }

  @Test("test traffic of mirror source with Egress")
  private async testEgress() {
    let aggId = await this.addAgg(this.portName1, 1);

    let sessionId = await this.addSrcMonitorSessionTX(1, aggId);

    try {
      let output = await this.output(sessionId);

      expect(output).toMatch("agg" + aggId);
    } finally {
      await this.removeSession(sessionId);

      await this.removeAgg(this.portName1);
    }
  }

  private async addAgg(portName: string, aggId: number): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > channel-group ${aggId} mode active
      > end
    `;
    return aggId;
  }

  private async removeAgg(portName: string) {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > no channel-group
      > end
    `;
  }

  private async addSrcMonitorSessionRX(
    sessionId: number,
    aggId: number
  ): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > monitor session ${sessionId} source interface agg ${aggId} rx
      > end
    `;
    return sessionId;
  }

  private async addSrcMonitorSessionTX(
    sessionId: number,
    aggId: number
  ): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > monitor session ${sessionId} source interface agg ${aggId} tx
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

  private async output(sessionId: number): Promise<string> {
    return await this.topo.dut.exec`
      > show monitor session ${sessionId}
    `;
  }
}
