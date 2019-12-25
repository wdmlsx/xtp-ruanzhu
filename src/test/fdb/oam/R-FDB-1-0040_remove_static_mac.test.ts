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

@Describe("R-RDB-1-0040 test remove static mac address entry")
class TestFDB {
  private portName: string;

  private mac: string = "0000.0000.0001";

  @BeforeAll
  private initPortName() {
    //port3 to port 0
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

  @Test("test remove static mac address entry")
  private async testConfig() {
    let macEntry = new MacEntry(this.portName, this.mac, "1");

    await this.addStaticMac(macEntry);

    await this.removeStaticMac(macEntry);

    let output = await this.output("static");

    const matcher = output.match(
      /\d+\s+[\w\d-]+\s+[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\s+\d+\s+\d+\s+\d+/g
    );

    if (matcher) {
      let entries = matcher
        .map(entryStr => this.getEntry(entryStr))
        .filter(entry => entry.compare(macEntry));
      expect(entries.length).toEqual(0);
    } else {
      expect(matcher).toBeNull();
    }
  }

  // add a static mac
  private async addStaticMac(entry: MacEntry) {
    await this.topo.dut.exec`
      > configure terminal
      > mac-address-table ${entry.mac} forward ${entry.portName} vlan ${entry.vlanId}
      > end
    `;
  }

  private async removeStaticMac(entry: MacEntry) {
    await this.topo.dut.exec`
      > configure terminal
      > no mac-address-table ${entry.mac} forward ${entry.portName} vlan ${entry.vlanId}
      > end
    `;
  }

  private getEntry(entry: string): MacEntry {
    // vlanId portName macAdr fwd static security
    const entryArr = entry.split(" ").filter(ele => ele !== "");

    if (entryArr.length < 6) return null;

    if (entryArr[4] !== "1") return null;

    const macEntry = new MacEntry(entryArr[1], entryArr[2], entryArr[0]);
    return macEntry;
  }

  // get output of all static mac
  private async output(type: string) {
    return await this.topo.dut.exec`
      > show mac address-table ${type}
    `;
  }

  private async clearStatic() {
    await this.topo.dut.exec`
      > clear mac address-table static
    `;
  }
}