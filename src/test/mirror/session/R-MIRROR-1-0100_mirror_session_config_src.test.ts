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
  "R-MIRROR-1-0100 test User can configure mirror session’s source. By default, there should not be any source configured for mirror session."
)
class TestMirrorSession {
  private sourPort: string;

  private destPort: string;

  /*
   * @Before注解会在所有@Test注解的测试方法前运行，
   * 只运行一次
   * 用于初始化一些数据
   * */
  @BeforeAll
  private init() {
    this.sourPort = this.topo.port[0];
    this.destPort = this.topo.port[1];
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

  @Test("test identifier session 1")
  private async testDefault() {
    let hasError = false;
    try {
      await this.topo.dut.exec`
        > show monitor session 1
      `;
    } catch (e) {
      hasError = true;
    }
    expect(hasError).toBeTruthy();
  }

  @Test("test config source port")
  private async testSession1() {
    try {
      await this.topo.dut.exec`
          > configure terminal
          > monitor session 1 source interface ${this.sourPort}
          > end
        `;

      let output = await this.topo.dut.exec`
        > show monitor session 1
      `;

      expect(output).toMatch(this.sourPort);
    } finally {
      await this.topo.dut.exec`
        > configure terminal
        > no monitor session 1
        > end
      `;
    }
  }
}
