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
  "R-MIRROR-4-0080 test Mirror destination port should not be shutdown."
)
class TestMirrorDstPort {
  private dstPort: string;

  @BeforeAll
  private init() {
    this.dstPort = this.topo.port[0];
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

  @Test("test Mirror destination port should not be shutdown.")
  private async testConfig() {
    let sessionId = await this.addMonitorSession(1, this.dstPort);

    let hasError = false;

    try {
      await this.topo.dut.exec`
        > configure terminal
        > interface ${this.dstPort}
        > shutdown
        > end
      `;
    } catch (e) {
      await this.topo.dut.exec`> end`;
      hasError = true;
    } finally {
      await this.removeSession(sessionId);
    }
    expect(hasError).toBeTruthy();
  }

  private async addMonitorSession(
    sessionId: number,
    porName: string
  ): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > monitor session ${sessionId} destination interface ${porName}
      > end 
    `;
    return sessionId;
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
