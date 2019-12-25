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
  "R-MIRROR-2-0050 test Source port can’t be mirror’s destination port."
)
class TestMirrorSrcPort {
  private sourPort: string;

  @BeforeAll
  private init() {
    this.sourPort = this.topo.port[0];
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

  @Test("test test Source port can’t be mirror’s destination port.")
  private async testConfig() {
    let hasError = false;

    try {
      await this.topo.dut.exec`
        > configure terminal
        > monitor session 1 destination interface ${this.sourPort}
        > monitor session 1 source interface ${this.sourPort}
        > end
      `;
    } catch (e) {
      await this.topo.dut.exec`> end`;
      hasError = true;
    } finally {
      await this.removeSession(1);
    }
    expect(hasError).toBeTruthy();
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
