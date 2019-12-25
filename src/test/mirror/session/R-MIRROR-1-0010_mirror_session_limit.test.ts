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

@Describe("R-MIRROR-1-0010 test Up to 3 mirror sessions should be supported")
class TestMirrorSession {
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

  @Test("Up to 3 mirror sessions should be supported")
  private async testLimit() {
    let matcher;
    try {
      await this.topo.dut.exec`
        > configure terminal
        > monitor session 4
      `;
    } catch (e) {
      matcher = e.message.match(/Invalid\sinput/g);
    } finally {
      await this.topo.dut.exec`> end`;
    }
    expect(matcher).not.toBeNull();
  }
}
