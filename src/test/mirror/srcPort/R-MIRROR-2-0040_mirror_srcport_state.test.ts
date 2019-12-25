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
  "R-MIRROR-2-0040 test A port become source port should not interfere with the normal operation of this port."
)
class TestMirrorSrcPort {
  private srcPort: string;
  private dstPort: string;

  @BeforeAll
  private init() {
    this.srcPort = this.topo.port[0];
    this.dstPort = this.topo.port[1];
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

  @Test(
    "test A port become source port should not interfere with the normal operation of this port."
  )
  private async testState() {
    await this.topo.dut.exec`
      > configure terminal
      > monitor session 1 source interface ${this.srcPort}
      > monitor session 1 destination interface ${this.dstPort}
      > end
    `;

    try {
      await this.topo.dut.exec`
        > configure terminal
        > interface ${this.srcPort}
        > no switchport
        > end
      `;

      let output = await this.topo.dut.exec`
        > show running-config interface ${this.srcPort}
      `;

      expect(output).toMatch("no switchport");
    } finally {
      await this.topo.dut.exec`
        > configure terminal
        > no monitor session 1
        > interface ${this.srcPort}
        > switchport
        > end
      `;
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