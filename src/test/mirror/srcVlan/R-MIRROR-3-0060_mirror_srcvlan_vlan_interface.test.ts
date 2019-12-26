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
  "R-MIRROR-3-0060 test User can monitor any VLANs to specified session, the VLAN range should be 1 to 4094. If the VLAN interface isn’t created in system, user can not configure this VLAN as mirror source. If the VLAN or VLAN interface is deleted after configured mirror source VLAN, the configuration of mirror source VLAN should be deleted."
)
class TestMirrorSrcVlan {
  private vlanId: number;

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
  @Test("test config vlan nonexistence")
  private async testVlanNone() {
    let hasError = false;

    await this.topo.dut.exec`
      > configure terminal
      > vlan database
      > vlan 100
      > end
    `;

    try {
      await this.addMonitorSession(1, 100);
    } catch (e) {
      await this.topo.dut.exec`> end`;

      hasError = true;
    } finally {
      await this.removeVlan(100);
    }
    expect(hasError).toBeTruthy();
  }

  @Test(
    "test the configuration of mirror source vlan should be deleted if the vlan is removed"
  )
  private async testDelete() {
    let vlanId = await this.addVlanInterface(100);

    let sessionId = await this.addMonitorSession(1, 100);

    await this.removeVlan(vlanId);

    let hasError = false;

    try {
      await this.output(sessionId);
    } catch (e) {
      hasError = true;
    }
    expect(hasError).toBeTruthy();
  }

  @Test(
    "test the configuration of mirror source vlan should be deleted if the vlan interface is removed"
  )
  private async testDeletVlanInterface() {
    let vlanId = await this.addVlanInterface(100);

    let sessionId = await this.addMonitorSession(1, 100);

    await this.topo.dut.exec`
      > configure terminal
      > no interface vlan ${vlanId}
      > end
    `;

    let hasError = false;

    try {
      await this.output(sessionId);
    } catch (e) {
      hasError = true;
    } finally {
      await this.removeVlan(vlanId);
    }
    expect(hasError).toBeTruthy();
  }

  //
  private async removeSession(sessionId: number) {
    await this.topo.dut.exec`
      > configure terminal
      > no monitor session ${sessionId}
      > end
    `;
  }

  private async removeVlan(vlanId: number) {
    await this.topo.dut.exec`
      > configure terminal
      > vlan database
      > no vlan ${vlanId}
      > end
    `;
  }

  private async output(sessionId: number): Promise<string> {
    return await this.topo.dut.exec`
      > show monitor session ${sessionId}
    `;
  }

  private async addMonitorSession(
    sessionId: number,
    vlanId: number
  ): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > monitor session ${sessionId} source vlan ${vlanId}
      > end
    `;

    return sessionId;
  }

  private async addVlanInterface(vlanId: number): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > vlan database
      > vlan 100
      > exit
      > interface vlan 100
      > end
    `;

    return vlanId;
  }
}
