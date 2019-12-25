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
  "R-MIRROR-2-0090 test Port’s ingress traffic and egress traffic can associate with different session or same session. User can specify the session by command."
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

  @Test("test config different session of the same port with tx and rx")
  private async testConfig() {
    try {
      await this.topo.dut.exec`
        > configure terminal
        > monitor session 1 source interface ${this.sourPort} tx
        > monitor session 2 source interface ${this.sourPort} rx
        > end
      `;

      let output1 = await this.output(1);
      let output2 = await this.output(2);

      expect(output1).toMatch(this.sourPort);
      expect(output2).toMatch(this.sourPort);
    } finally {
      await this.removeSession(1);
      await this.removeSession(2);
    }
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
