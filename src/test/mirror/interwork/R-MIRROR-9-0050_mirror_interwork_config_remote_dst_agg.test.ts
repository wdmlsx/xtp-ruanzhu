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
  "R-MIRROR-9-0050 User should not be allowed configure mirror remote destination port on an aggression port."
)
class TestInterwork {
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

  @Test(
    "test User should not be allowed configure mirror remote destination port on an aggression port."
  )
  private async testConfig() {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${this.dstPort}
      > channel-group 1 mode active
      > end
    `;

    await this.topo.dut.exec`
      > configure terminal
      > vlan database
      > vlan 100
      > exit
      > interface vlan 100
      > end
    `;

    let hasError = false;
    try {
      await this.topo.dut.exec`
        > configure terminal
        > monitor session 1 destination remote vlan 100 interface agg1
        > end
      `;
    } catch (e) {
      await this.topo.dut.safeExec`> end`;
      hasError = true;
    } finally {
      // await th
      await this.topo.dut.exec`
        > configure terminal
        > interface ${this.dstPort}
        > no channel-group
        > exit
        > vlan database
        > no vlan 100
        > end
      `;
    }
    expect(hasError).toBeTruthy();
  }
}
