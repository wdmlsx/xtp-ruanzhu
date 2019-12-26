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

@Describe(
  "R-FDB-1-0190 test config aging time of mac address entries of the system"
)
class TestFDB {
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
  @Test("test default ageing-time of system is 300")
  private async testDefaultVlaue() {
    const output = await this.topo.dut.exec`
        > show mac address-table ageing-time
      `;

    const matcher = output.match(/ageing\stime\sis\s\d+/g);

    if (matcher) {
      expect(parseInt(matcher[0].match(/\d+/g)[0])).toEqual(300);
    } else {
      expect(matcher).not.toBeNull();
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test ageing-time should not less than 10")
  private async testLess10() {
    let haseError = false;

    try {
      await this.topo.dut.exec`
        > configure terminal
        > mac-address-table ageing-time 9
      `;
    } catch (e) {
      haseError = true;
    } finally {
      await this.topo.dut.exec`> end`;
    }
    expect(haseError).toBeTruthy();
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test ageing-time should not greater than 1 000 000")
  private async testGreater1000000() {
    let haseError = false;

    try {
      await this.topo.dut.exec`
        > configure terminal
        > mac-address-table ageing-time 1000001
      `;
    } catch (e) {
      haseError = true;
    } finally {
      await this.topo.dut.exec`> end`;
    }
    expect(haseError).toBeTruthy();
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test show the ageing-time of the system")
  private async testConfig() {
    try {
      await this.topo.dut.exec`
        > configure terminal
        > mac-address-table ageing-time 500
        > end
      `;
      const output = await this.topo.dut.exec`
        > show mac address-table ageing-time
      `;

      const matcher = output.match(/ageing\stime\sis\s\d+/g);

      if (matcher) {
        expect(parseInt(matcher[0].match(/\d+/g)[0])).toEqual(500);
      } else {
        expect(matcher).not.toBeNull();
      }
    } finally {
      await this.topo.dut.exec`
        > configure terminal
        > no mac-address-table ageing-time
        > end
      `;
    }
  }
}
