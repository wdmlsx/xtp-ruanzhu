import { SingleDevice } from "../../topos/single-device";
import {
  AfterAll,
  AfterEach,
  BeforeAll,
  BeforeEach,
  Describe,
  InjectTopo,
  Test,
  TestOnly
} from "../../decorators";

/*
 * @Describe注解用于描述该测试用例所测试的功能
 * 该文字描述会在脚本执行完毕后在终端输出，也会记录到测试报告中，方便用户查看
 * */
@Describe(
  "R-RDB-1-0290 test configure no mac learning enable for switch interface"
)
class TestInterface {
  private portName: string;

  private aggId: string = "1";

  /*
   * @BeforeAll注解会在所有@Test注解的测试方法前运行，
   * 只运行一次
   * 用于初始化一些数据
   * */
  @BeforeAll
  private initPortName() {
    //port 8 to port 0
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
  @Test("test config on agg menber and agg interface should be failure")
  private async testOnMemberAndAgg() {
    try {
      let aggName = await this.addPortToAgg(this.portName, this.aggId);

      let hasErrorOnMember = false;
      let hasErrorOnAgg = false;

      try {
        await this.topo.dut.exec`
          > configure terminal
          > interface ${this.portName}
          > mac learning disable
          > end
        `;
      } catch (e) {
        await this.topo.dut.exec`> end`;
        hasErrorOnMember = true;
      }

      try {
        await this.topo.dut.exec`
          > configure terminal
          > interface ${aggName}
          > mac learning disable
          > end
        `;
      } catch (e) {
        await this.topo.dut.exec`> end`;
        hasErrorOnAgg = true;
      }

      expect(hasErrorOnAgg && hasErrorOnMember).toBeTruthy();
    } finally {
      await this.reset(this.portName);
    }
  }

  private async changeToSwitch(portName: string) {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > no switchport
      > switchport
      > end
    `;
  }

  private async addPortToAgg(portName: string, aggId: string): Promise<any> {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > channel-group ${aggId} mode active
      > end
    `;
    return "agg1";
  }

  private async reset(portName: string) {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > no channel-group
      > end
    `;
  }
}
