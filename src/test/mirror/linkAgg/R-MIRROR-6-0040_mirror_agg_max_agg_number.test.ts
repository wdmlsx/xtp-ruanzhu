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
  "R-MIRROR-6-0040 test System should support any number of source aggregators ( up to the maximum number of available aggregators on the system) for any session."
)
class TestMirrorSession {
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
  @Test(
    "System should support any number of source aggregators ( up to the maximum number of available aggregators on the system) for any session."
  )
  private async testConfig() {
    let portMap = this.topo.port;
    //
    let count = 0;

    let start: string;
    // add agg
    for (let i = portMap.count + 1; i > 1; i--) {
      let hasError = false;
      try {
        await this.addAgg(portMap[i - 2], portMap.count - i + 2);
        count++;
        start = portMap[i - 2];
      } catch (e) {
        await this.topo.dut.exec`> end`;

        hasError = true;
      }
      if (hasError) break;
    }

    // add all agg to session 1
    try {
      for (let i = 1; i < count + 1; i++) {
        await this.addSrcMonitorSession(1, i);
      }

      let output = await this.output(1);

      // verify all agg
      for (let i = 1; i < count; i++) {
        expect(output).toMatch("agg" + i);
      }
    } finally {
      await this.removeSession(1);

      await this.removeAgg(start, portMap.count);
    }
  }

  private async addAgg(portName: string, aggId): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > channel-group ${aggId} mode active
      > end
    `;
    return aggId;
  }

  private async removeAgg(portName: string, count: number) {
    await this.topo.dut.exec`
      > configure terminal
      > interface range ${portName} - ${count}
      > no channel-group
      > end
    `;
  }

  private async addSrcMonitorSession(
    sessionId: number,
    aggId: number
  ): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > monitor session ${sessionId} source interface agg ${aggId}
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
