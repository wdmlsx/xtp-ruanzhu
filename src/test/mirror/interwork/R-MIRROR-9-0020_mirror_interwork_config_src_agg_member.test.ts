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
  "R-MIRROR-9-0020 test User should not be allowed to configure mirror source on an aggression’s member port. A port which has configured as mirror source should not be allowed to join the aggression."
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

  @Test("test config mirror session source on agg member port")
  private async testConfig() {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${this.sourPort}
      > channel-group 1 mode active
      > end
    `;

    let hasError = false;

    try {
      await this.topo.dut.exec`
        > configure terminal
        > monitor session 1 source interface ${this.sourPort}
        > end
      `;
    } catch (e) {
      await this.topo.dut.safeExec`> end`;
      hasError = true;
    } finally {
      // await th
      await this.topo.dut.exec`
        > configure terminal
        > interface ${this.sourPort}
        > no channel-group
        > end
      `;
    }
    expect(hasError).toBeTruthy();
  }

  @Test("test add port in agg which has been added in monitor session")
  private async testJoin() {
    await this.topo.dut.exec`
      > configure terminal
      > monitor session 1 source interface ${this.sourPort}
      > end
    `;
    let hasError = false;
    try {
      await this.topo.dut.exec`
        > configure terminal
        > interface ${this.sourPort}
        > channel-group 1 mode active
        > end
      `;
    } catch (e) {
      await this.topo.dut.safeExec`> end`;
      hasError = true;
    } finally {
      await this.topo.dut.exec`
        > configure terminal
        > no monitor session 1
        > end
      `;
    }
    expect(hasError).toBeTruthy();
  }
}
