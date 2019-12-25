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
import has = Reflect.has;

@Describe(
  "R-MIRROR-1-0060 test If a session neither have source nor have destination, it should not be displayed when use show-command"
)
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

  @Test("test show session if it has no src and dst")
  private async testSession1() {
    let hasError = false;
    try {
      let output = await this.topo.dut.exec`
        > show monitor session 1
      `;
    } catch (e) {
      hasError = true;
    }
    expect(hasError).toBeTruthy();
  }
}
