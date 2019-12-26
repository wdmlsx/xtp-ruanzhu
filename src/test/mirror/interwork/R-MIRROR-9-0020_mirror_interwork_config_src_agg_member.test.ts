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
  "R-MIRROR-9-0020 test User should not be allowed to configure mirror source on an aggression’s member port. A port which has configured as mirror source should not be allowed to join the aggression."
)
class TestInterwork {
  private sourPort: string;

  /*
   * @Before注解会在所有@Test注解的测试方法前运行，
   * 只运行一次
   * 用于初始化一些数据
   * */
  @BeforeAll
  private init() {
    this.sourPort = this.topo.port[0];
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

  @Test("test config mirror session source on agg member port")
  private async testConfig() {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${this.sourPort}
      > channel-group 1 mode active
      > end
    `;

    let hasError = false;

    try {
      await this.topo.dut.exec`
        > configure terminal
        > monitor session 1 source interface ${this.sourPort}
        > end
      `;
    } catch (e) {
      await this.topo.dut.safeExec`> end`;
      hasError = true;
    } finally {
      // await th
      await this.topo.dut.exec`
        > configure terminal
        > interface ${this.sourPort}
        > no channel-group
        > end
      `;
    }
    expect(hasError).toBeTruthy();
  }

  @Test("test add port in agg which has been added in monitor session")
  private async testJoin() {
    await this.topo.dut.exec`
      > configure terminal
      > monitor session 1 source interface ${this.sourPort}
      > end
    `;
    let hasError = false;
    try {
      await this.topo.dut.exec`
        > configure terminal
        > interface ${this.sourPort}
        > channel-group 1 mode active
        > end
      `;
    } catch (e) {
      await this.topo.dut.safeExec`> end`;
      hasError = true;
    } finally {
      await this.topo.dut.exec`
        > configure terminal
        > no monitor session 1
        > end
      `;
    }
    expect(hasError).toBeTruthy();
  }
}
