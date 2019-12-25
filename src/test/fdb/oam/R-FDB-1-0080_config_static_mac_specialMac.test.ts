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
  "R-RDB-1-0080 test config static mac address should forbid special mac address"
)
class TestFDB {
  private portName: string;

  private mac1: string = "FFFF.FFFF.FFFF";
  private mac2: string = "0180.C200.0000";

  @BeforeAll
  private initPortName() {
    //port 9  to port 0
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

  @Test(
    `test config static mac address should forbid special mac address [FFFF.FFFF.FFFF]`
  )
  private async testConfigMac1() {
    let haseError = false;

    try {
      await this.topo.dut.exec`
        > configure terminal
        > mac-address-table ${this.mac1} forward ${this.portName} vlan 1
        > end
      `;
    } catch (e) {
      haseError = true;
    } finally {
      await this.topo.dut.exec`> end`;
    }

    expect(haseError).toBeTruthy();
  }

  @Test(
    `test config static mac address should forbid special mac address [0180.C200.0000]`
  )
  private async testConfigMac2() {
    let haseError = false;

    try {
      await this.topo.dut.exec`
        > configure terminal
        > mac-address-table ${this.mac2} forward ${this.portName} vlan 1
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
