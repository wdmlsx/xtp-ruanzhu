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
  "R-MIRROR-2-0030 test System should support any number of source ports (up to the maximum number of available ports on the system) for any session."
)
class TestMirrorSrcPort {
  /*
   * @InjectTopo 注解用于给该测试类注入拓扑
   * 初始化该类时注入虚拟拓扑
   * */
  @InjectTopo
  private readonly topo: SingleDevice;

  /*
   * @Before注解会在所有@Test注解的测试方法前运行，
   * 只运行一次
   * 用于初始化一些数据
   * */
  @BeforeEach
  private async beforeEach() {
    jest.setTimeout(30000);

    await this.topo.dut.connect();
  }

  @AfterEach
  private async afterEach() {
    await this.topo.dut.end();
  }

  @Test("test add all ports to source")
  private async testAddAll() {
    try {
      let port = this.topo.port;
      await this.topo.dut.exec`> configure terminal`;

      for (let i = 0; i < port.count; i++) {
        await this.topo.dut
          .exec`> monitor session 1 source interface ${port[i]}`;
      }

      await this.topo.dut.exec`> end`;
      let output = await this.output(1);
      for (let i = 0; i < port.count; i++) {
        expect(output).toMatch(port[i]);
      }
    } finally {
      await this.removeSession(1);
    }
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
