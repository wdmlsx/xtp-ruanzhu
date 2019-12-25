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
  "R-MIRROR-1-0070 test User can configure mirror session’s destination port. By default, there should not be any destination port configured for mirror session."
)
class TestMirrorSession {
  private sourPort: string;

  private destPort: string;

  @BeforeAll
  private init() {
    this.sourPort = this.topo.port[0];
    this.destPort = this.topo.port[1];
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

  @Test("test identifier session 1")
  private async testDefault() {
    let hasError = false;
    try {
      await this.topo.dut.exec`
        > show monitor session 1
      `;
    } catch (e) {
      hasError = true;
    }
    expect(hasError).toBeTruthy();
  }

  @Test("test config destination port")
  private async testConfig() {
    try {
      await this.topo.dut.exec`
          > configure terminal
          > monitor session 1 destination interface ${this.destPort}
          > end
        `;

      let output = await this.topo.dut.exec`
        > show monitor session 1
      `;

      expect(output).toMatch(this.destPort);
    } finally {
      await this.topo.dut.exec`
        > configure terminal
        > no monitor session 1
        > end
      `;
    }
  }
}
