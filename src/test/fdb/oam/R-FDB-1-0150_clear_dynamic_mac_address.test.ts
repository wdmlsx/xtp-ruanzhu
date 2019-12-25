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

@Describe("R-RDB-1-0150 test clear dynamic mac entry")
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

  private portName1: string;

  private mac: string = "0000.0000.0001";

  private vlanId: string = "100";

  @BeforeAll
  private initPortName() {
    this.portName1 = this.topo.port[0];
  }

  @Test("test clear dynamic mac entry")
  private async testConfig() {
    expect("dynamic").toBeNull();
  }

  private async changeToSwitch(portName: string) {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > no switchport
      > switchport
      > end
    `;
  }

  // remove vlan 100 and clear static mac table
  private async reset() {
    await this.topo.dut.exec`
      > configure terminal
      > vlan database
      > no vlan ${this.vlanId}
      > end
      > clear mac address-table static
    `;
  }

  // add a static mac
  private async addMac(entry: MacEntry) {
    await this.topo.dut.exec`
      > configure terminal
      > mac-address-table ${entry.mac} forward ${entry.portName} vlan ${entry.vlanId}
      > end
    `;
  }

  // add a vlan
  private async addVlan(vlanId: string) {
    await this.topo.dut.exec`
      > configure terminal
      > vlan database
      > vlan ${vlanId}
      > end
    `;
  }

  // add a port to a vlan
  private async addPortToVlan(portName: string, vlanId: string) {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > switchport access allow vlan add ${vlanId}
      > end
    `;
  }

  // get output of all static mac
  private async output(type: string) {
    return await this.topo.dut.exec`
      > show mac address-table ${type}
    `;
  }

  // get a mac entry from matcher
  private getEntry(entry: string): MacEntry {
    // vlanId portName macAdr fwd static security
    const entryArr = entry.split(" ").filter(ele => ele !== "");

    if (entryArr.length < 5) return null;

    if (entryArr[4] !== "1") return null;

    const macEntry = new MacEntry(entryArr[1], entryArr[2], entryArr[0]);
    return macEntry;
  }
}
