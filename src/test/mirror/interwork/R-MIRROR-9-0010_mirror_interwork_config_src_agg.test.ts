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
  "R-MIRROR-9-0010 test User should be allowed to configure mirror source on an aggression port. All member ports of the aggression should share this configuration of mirror source follow the rule [R-MIRROR-2-0070] or [R-MIRROR-2-0080], until the member leaves the aggression."
)
class TestInterwork {
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

  @Test("test config mirror session source on agg port")
  private async testConfig() {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${this.sourPort}
      > channel-group 1 mode active
      > end
    `;

    await this.topo.dut.exec`
      > configure terminal
      > monitor session 1 source interface agg1
      > end
    `;
    try {
      let output = await this.topo.dut.exec`
        > show monitor session 1
      `;
      expect(output).toMatch("agg1");
    } finally {
      // await th
      await this.topo.dut.exec`
        > configure terminal
        > no monitor session 1
        > interface ${this.sourPort}
        > no channel-group
        > end
      `;
    }
  }
}
