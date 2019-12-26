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

@Describe("R-FDB-1-0200 test show the ageing-time of the system")
class TestInterface {
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

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test show the ageing-time of the system default value is 300")
  private async testShow() {
    const output = await this.topo.dut.exec`
      > show mac address-table ageing-time
    `;

    const matcher = output.match(/ageing\stime\sis\s\d+/g);

    if (matcher) {
      let time = matcher[0].match(/\d+/g)[0];
      expect(time).toEqual("300");
    } else {
      expect(matcher).not.toBeNull();
    }
  }
}
