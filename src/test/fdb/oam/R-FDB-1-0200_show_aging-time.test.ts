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

@Describe("R-FDB-1-0200 test show the ageing-time of the system")
class TestInterface {
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
