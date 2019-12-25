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
import { MacEntry } from "./MacEntry";

@Describe(
  "R-RDB-1-0020 test static mac address entry should not prevent packet with the MAC SA of the entry into the system from other port"
)
class TestFDB {
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
    "test static mac address entry should not prevent packet with the MAC SA of the entry into the system from other port"
  )
  private async testConfig() {
    expect("mac sa").toBeNull();
  }
}
