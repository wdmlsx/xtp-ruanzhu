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
  "R-STORM-1-0100 test user shouldbe able to configure IPG global to let storm control calculate IPG bytes."
)
class TestStromControl {
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

  @Test("test ipg is disable by default")
  private async testDefault() {
    let output = await this.topo.dut.exec`
      > show running-config
    `;
    let matcher = output.match(/ipg\sstorm-control\senable/g);

    expect(matcher).toBeNull();
  }

  @Test("test ipg can be enabled")
  private async testConfig() {
    try {
      await this.topo.dut.exec`
        > configure terminal
        > ipg storm-control enable
        > end
      `;
      let output = await this.topo.dut.exec`
        > show running-config
      `;
      let matcher = output.match(/ipg\sstorm-control\senable/g);

      expect(matcher).not.toBeNull();
    } finally {
      await this.topo.dut.exec`
        > configure terminal
        > no ipg storm-control enable
        > end
      `;
    }
  }
}
