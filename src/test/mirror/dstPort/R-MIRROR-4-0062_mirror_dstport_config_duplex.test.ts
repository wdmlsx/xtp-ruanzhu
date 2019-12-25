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
  "R-MIRROR-4-0062 test If a port is mirror’s destination port, user can still configure the speed/duplex of this port, but the real statues might not coincide with the values which are displayed, until this port becomes normal port"
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

  @Test("test config speed")
  private async testSpeed() {
    let sessionId = await this.addMonitorSession(1, this.dstPort);
    try {
      await this.topo.dut.exec`
        > configure terminal
        > interface ${this.dstPort}
        > speed 100
        > end
      `;

      let output = await this.topo.dut.exec`
        > show interface ${this.dstPort}
      `;

      let matcher = output.match(/Speed\s-\s100/g);

      expect(matcher).not.toBeNull();
    } finally {
      await this.topo.dut.exec`
        > configure terminal
        > interface ${this.dstPort}
        > no speed
        > end
      `;
    }
  }

  @Test("test config duplex")
  private async testDuplex() {
    let sessionId = await this.addMonitorSession(1, this.dstPort);

    try {
      await this.topo.dut.exec`
      > configure terminal
      > interface ${this.dstPort}
      > duplex half
      > end
    `;

      let output = await this.topo.dut.exec`
      > show interface ${this.dstPort}
    `;

      let matcher = output.match(/Duplex\s-\sHalf/g);

      expect(matcher).not.toBeNull();
    } finally {
      await this.topo.dut.exec`
      > configure terminal
      > interface ${this.dstPort}
      > no duplex 
      > end
    `;
      await this.removeSession(sessionId);
    }
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
