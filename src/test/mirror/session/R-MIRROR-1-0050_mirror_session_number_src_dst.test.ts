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
  "R-MIRROR-1-0050 test session can only have one mirror dest and a set of mirror src"
)
class TestMirrorSession {
  private sourPort1: string;
  private sourPort2: string;

  private destPort1: string;
  private destPort2: string;

  /*
   * @Before注解会在所有@Test注解的测试方法前运行，
   * 只运行一次
   * 用于初始化一些数据
   * */
  @BeforeAll
  private init() {
    this.sourPort1 = this.topo.port[0];
    this.sourPort2 = this.topo.port[1];
    this.destPort1 = this.topo.port[2];
    this.destPort2 = this.topo.port[3];
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

  @Test("test session can only have one mirror dest")
  private async testDst() {
    try {
      await this.topo.dut.exec`
        > configure terminal
        > monitor session 1 source interface ${this.sourPort1}
        > monitor session 1 destination interface ${this.destPort1}
        > monitor session 1 destination interface ${this.destPort2}
        > end
      `;

      let output = await this.topo.dut.exec`
        > show monitor session 1
      `;

      expect(output).not.toMatch(this.destPort1);
      expect(output).toMatch(this.destPort2);
    } finally {
      await this.topo.dut.exec`
        > configure terminal
        > no monitor session 1
        > end
      `;
    }
  }

  @Test("test session can have a set of mirror src")
  private async testSrc() {
    try {
      await this.topo.dut.exec`
        > configure terminal
        > monitor session 1 source interface ${this.sourPort1}
        > monitor session 1 source interface ${this.sourPort2}
        > monitor session 1 destination interface ${this.destPort1}
        > end
      `;

      let output = await this.topo.dut.exec`
        > show monitor session 1
      `;

      expect(output).toMatch(this.sourPort1);
      expect(output).toMatch(this.sourPort2);
    } finally {
      await this.topo.dut.exec`
        > configure terminal
        > no monitor session 1
        > end
      `;
    }
  }
}
