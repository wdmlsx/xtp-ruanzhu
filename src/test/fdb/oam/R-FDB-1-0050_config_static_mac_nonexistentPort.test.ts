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
  "R-RDB-1-0050 test config static mac address entry on a nonexistent port"
)
class TestFDB {
  private portName: string = "eth-0-100000";

  private mac: string = "0000.0000.0001";

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
    `test config static mac address entry on a nonexistent port [${this.portName}]`
  )
  private async testConfig() {
    let haseError = false;
    try {
      await this.topo.dut.exec`
        > configure terminal
        > mac-address-table ${this.mac} forward ${this.portName} vlan 1
        > end
      `;
    } catch (e) {
      haseError = true;
    } finally {
      await this.topo.dut.exec`> end`;
    }

    expect(haseError).toBeTruthy();
  }
}
