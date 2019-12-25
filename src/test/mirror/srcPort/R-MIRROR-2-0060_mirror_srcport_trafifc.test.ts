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
  "R-MIRROR-2-0060 test Traffic of mirror source port should include port ingress traffic and port egress traffic."
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

  @Test("test config ingress trafifc")
  private async testIngress() {
    try {
      await this.topo.dut.exec`
        > configure terminal
        > monitor session 1 source interface ${this.sourPort} tx
        > end
      `;

      let output = await this.output(1);

      expect(output).toMatch(this.sourPort);
    } finally {
      await this.removeSession(1);
    }
  }

  @Test("test config engress trafifc")
  private async testEgress() {
    try {
      await this.topo.dut.exec`
        > configure terminal
        > monitor session 1 source interface ${this.sourPort} rx
        > end
      `;

      let output = await this.output(1);

      expect(output).toMatch(this.sourPort);
    } finally {
      await this.removeSession(1);
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
