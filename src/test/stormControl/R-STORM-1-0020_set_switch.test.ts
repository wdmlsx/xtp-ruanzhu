import { SingleDevice } from "../../topos/single-device";
import {
  AfterEach,
  BeforeAll,
  BeforeEach,
  Describe,
  InjectTopo,
  Test,
  TestOnly
} from "../../decorators";

@Describe(
  "R-STORM-1-0020 test strom control can only be set on aggregation member interface, disabled by default"
)
class TestStromControl {
  private portName: string;

  @BeforeAll
  private init() {
    this.portName = this.topo.port[0];
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

  @AfterEach
  private async afterEach() {
    await this.topo.dut.end();
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test storm control can only be set on switch interface")
  private async testConfig() {
    try {
      await this.topo.dut.exec`
        > configure terminal
        > interface ${this.portName}
        > no switchport
        > end
      `;
      let hasError = false;
      try {
        await this.topo.dut.exec`
          > configure terminal
          > interface ${this.portName} 
          > storm-control broadcast level 50
          > end
        `;
      } catch {
        await this.topo.dut.exec`> end`;
        hasError = true;
      }
      expect(hasError).toBeTruthy();
    } finally {
      await this.topo.dut.exec`
        > configure terminal
        > interface ${this.portName}
        > switchport
        > end
      `;
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test storm control should be disabled by default")
  private async testDefault() {
    let output = await this.topo.dut.exec`
      > show running-config interface ${this.portName}
    `;

    let matcher = output.match(/storm-control/g);

    expect(matcher).toBeNull();
  }
}
