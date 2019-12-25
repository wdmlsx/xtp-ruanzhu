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

@Describe(
  "R-MIRROR-1-0090 test Different sessions should not have same destination port."
)
class TestMirrorSession {
  private destPort: string;

  @BeforeAll
  private init() {
    this.destPort = this.topo.port[0];
  }

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

  @Test("test Different sessions should not have same destination port.")
  private async testConfig() {
    let hasError = false;

    try {
      await this.topo.dut.exec`
        > configure terminal
        > monitor session 1 destination interface ${this.destPort}
        > monitor session 2 destination interface ${this.destPort}
        > end
      `;
    } catch (e) {
      await this.topo.dut.exec`> end`;
      hasError = true;
    } finally {
      await this.topo.dut.exec`
        > configure terminal
        > no monitor session 1
        > no monitor session 2
        > end
      `;
    }
    expect(hasError).toBeTruthy();
  }
}
