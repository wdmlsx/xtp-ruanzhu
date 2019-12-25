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
  "R-RDB-1-0060 test config static mac address entry on a nonexistent vlan"
)
class TestFDB {
  private portName: string;

  private mac: string = "0000.0000.0001";

  private vlanId: number = 1226;

  @BeforeAll
  private initPortName() {
    // port9 to port 0
    this.portName = this.topo.port[0];
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

  @Test(`test config static mac address entry on  a nonexistent vlan`)
  private async testConfig() {
    await this.removeVlan();

    let haseError = false;
    try {
      await this.topo.dut.exec`
        > configure terminal
        > mac-address-table ${this.mac} forward ${this.portName} vlan ${this.vlanId}
        > end
      `;
    } catch (e) {
      haseError = true;
    } finally {
      await this.topo.dut.exec`> end`;
    }

    expect(haseError).toBeTruthy();
  }

  private async removeVlan() {
    await this.topo.dut.exec`
      > configure terminal
      > vlan database
      > no vlan ${this.vlanId}
      > end
    `;
  }
}
