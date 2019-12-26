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
  "R-MIRROR-4-0062 test If a port is mirror’s destination port, user can still configure the speed/duplex of this port, but the real statues might not coincide with the values which are displayed, until this port becomes normal port"
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

  @Test("test config speed")
  private async testSpeed() {
    let sessionId = await this.addMonitorSession(1, this.dstPort);
    try {
      await this.topo.dut.exec`
        > configure terminal
        > interface ${this.dstPort}
        > speed 100
        > end
      `;

      let output = await this.topo.dut.exec`
        > show interface ${this.dstPort}
      `;

      let matcher = output.match(/Speed\s-\s100/g);

      expect(matcher).not.toBeNull();
    } finally {
      await this.topo.dut.exec`
        > configure terminal
        > interface ${this.dstPort}
        > no speed
        > end
      `;
    }
  }

  @Test("test config duplex")
  private async testDuplex() {
    let sessionId = await this.addMonitorSession(1, this.dstPort);

    try {
      await this.topo.dut.exec`
      > configure terminal
      > interface ${this.dstPort}
      > duplex half
      > end
    `;

      let output = await this.topo.dut.exec`
      > show interface ${this.dstPort}
    `;

      let matcher = output.match(/Duplex\s-\sHalf/g);

      expect(matcher).not.toBeNull();
    } finally {
      await this.topo.dut.exec`
      > configure terminal
      > interface ${this.dstPort}
      > no duplex 
      > end
    `;
      await this.removeSession(sessionId);
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

  private async output(sessionId: number): Promise<string> {
    return await this.topo.dut.exec`
      > show monitor session ${sessionId}
    `;
  }
}
