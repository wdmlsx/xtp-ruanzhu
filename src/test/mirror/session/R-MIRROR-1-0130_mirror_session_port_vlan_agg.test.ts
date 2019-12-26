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
  "R-MIRROR-1-0130 test Port, VLAN and aggregator can be configured as mirror source and other interface should not be allowed to become mirror source."
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

  @Test("test config port")
  private async testPort() {
    try {
      await this.topo.dut.exec`
        > configure terminal
        > monitor session 1 source interface ${this.sourPort}
        > monitor session 1 destination interface ${this.destPort}
        > end
      `;
      let output = await this.output(1);

      expect(output).toMatch(this.sourPort);

      expect(output).toMatch(this.destPort);
    } finally {
      await this.removeSession(1);
    }
  }

  @Test("test config vlan")
  private async testVlan() {
    let vlanId = await this.addVlanInterface(100);

    await this.topo.dut.exec`
      > configure terminal
      > monitor session 1 source vlan 100
      > end
    `;

    let output = await this.output(1);

    expect(output).toMatch(vlanId + "");
    try {
    } finally {
      await this.removeSession(1);
      await this.removeVlan(vlanId);
    }
  }

  @Test("test config agg")
  private async testAgg() {
    try {
      let agg1 = await this.addAgg(this.sourPort, 1);

      await this.topo.dut.exec`
        > configure terminal
        > monitor session 1 source interface agg1
        > end
      `;

      let output = await this.output(1);

      expect(output).toMatch(agg1);
    } finally {
      await this.removeSession(1);
      await this.removeAgg(this.sourPort);
    }
  }

  //
  private async addVlanInterface(vlanId: number): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > vlan database
      > vlan ${vlanId}
      > exit
      > interface vlan 100
      > end
    `;
    return vlanId;
  }

  // private async addPortToVlan(portName: string, vlanId: number) {
  //   await this.topo.dut.exec`
  //     > configure terminal
  //     > interface ${portName}
  //     > switchport access vlan ${vlanId}
  //     > end
  //   `;
  // }

  private async removeVlan(vlanId: number) {
    await this.topo.dut.exec`
      > configure terminal
      > vlan database
      > no vlan ${vlanId}
      > end
    `;
  }

  private async addAgg(portName: string, aggId: number): Promise<string> {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > channel-group ${aggId} mode active
      > end
    `;
    return "agg" + aggId;
  }

  private async removeAgg(portName: string) {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > no channel-group
      > end
    `;
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
