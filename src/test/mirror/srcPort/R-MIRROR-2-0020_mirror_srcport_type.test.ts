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
  "R-MIRROR-2-0020 test mirror source port should be physical interface which can be l2 or l3"
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

  @Test("test config l2 port")
  private async testConfigL2() {
    try {
      await this.topo.dut.exec`
        > configure terminal
        > monitor session 1 source interface ${this.sourPort}
        > end
      `;

      let output = await this.output(1);

      expect(output).toMatch(this.sourPort);
    } finally {
      await this.removeSession(1);
    }
  }

  @Test("test config l3 port")
  private async testConfigL3() {
    await this.changeToL3(this.sourPort);

    try {
      await this.addMonitorSrc(1, this.sourPort);

      let output = await this.output(1);

      expect(output).toMatch(this.sourPort);
    } finally {
      await this.removeSession(1);
      await this.resetToL2(this.sourPort);
    }
  }

  private async removeSession(sessionId: number) {
    await this.topo.dut.exec`
      > configure terminal
      > no monitor session ${sessionId}
      > end
    `;
  }

  private async changeToL3(portName: string) {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > no switchport
      > end
    `;
  }

  private async resetToL2(portName: string) {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > switchport
      > end
    `;
  }
  private async addMonitorSrc(sessId: number, portName: string) {
    await this.topo.dut.exec`
      > configure terminal
      > monitor session ${sessId} source interface ${portName}
      > end
    `;
  }

  private async output(sessionId: number): Promise<string> {
    return await this.topo.dut.exec`
      > show monitor session ${sessionId}
    `;
  }
}
