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
  "R-MIRROR-1-0020 test Each mirror session should have an identifier with it. The range of session identifier should be 1 to 3."
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
  private async testSession1() {
    try {
      await this.topo.dut.exec`
        > configure terminal
        > monitor session 1 source interface ${this.sourPort}
        > monitor session 1 destination interface ${this.destPort}
        > end
      `;

      let output = await this.topo.dut.exec`
        > show monitor session 1
      `;

      let matcher = output.match(/Session\s+1/g);

      expect(matcher).not.toBeNull();
    } finally {
      await this.topo.dut.exec`
        > configure terminal
        > no monitor session 1
        > end
      `;
    }
  }
}
