import { SingleDevice } from "../../topos/single-device";
import {
  AfterAll,
  AfterEach,
  BeforeAll,
  BeforeEach,
  Describe,
  InjectTopo,
  Test,
  TestOnly
} from "../../decorators";

@Describe(
  "R-RDB-1-0070 test config static mac address entry if the interface not belongs to the designated vlan"
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

  private portName: string;

  private mac: string = "0000.0000.0001";

  private vlanId: number = 1226;

  @BeforeAll
  private initPortName() {
    //port 9  to port 0
    this.portName = this.topo.port[0];
  }

  @Test(
    `test config static mac address entry if the interface not belongs to the designated vlan`
  )
  private async testConfig() {
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
}
