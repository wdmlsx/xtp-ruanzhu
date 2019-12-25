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
import has = Reflect.has;

@Describe(
  "R-MIRROR-1-0050 test session can only have one mirror dest and a set of mirror src"
)
class TestMirrorSession {
  private sourPort1: string;
  private sourPort2: string;

  private destPort1: string;
  private destPort2: string;

  @BeforeAll
  private init() {
    this.sourPort1 = this.topo.port[0];
    this.sourPort2 = this.topo.port[1];
    this.destPort1 = this.topo.port[2];
    this.destPort2 = this.topo.port[3];
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

  @Test("test session can only have one mirror dest")
  private async testDst() {
    try {
      await this.topo.dut.exec`
        > configure terminal
        > monitor session 1 source interface ${this.sourPort1}
        > monitor session 1 destination interface ${this.destPort1}
        > monitor session 1 destination interface ${this.destPort2}
        > end
      `;

      let output = await this.topo.dut.exec`
        > show monitor session 1
      `;

      expect(output).not.toMatch(this.destPort1);
      expect(output).toMatch(this.destPort2);
    } finally {
      await this.topo.dut.exec`
        > configure terminal
        > no monitor session 1
        > end
      `;
    }
  }

  @Test("test session can have a set of mirror src")
  private async testSrc() {
    try {
      await this.topo.dut.exec`
        > configure terminal
        > monitor session 1 source interface ${this.sourPort1}
        > monitor session 1 source interface ${this.sourPort2}
        > monitor session 1 destination interface ${this.destPort1}
        > end
      `;

      let output = await this.topo.dut.exec`
        > show monitor session 1
      `;

      expect(output).toMatch(this.sourPort1);
      expect(output).toMatch(this.sourPort2);
    } finally {
      await this.topo.dut.exec`
        > configure terminal
        > no monitor session 1
        > end
      `;
    }
  }
}
