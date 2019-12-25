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
  "R-RDB-1-0110 test Unique multicast MAC address entry Key (MAC + VLAN) can exist in multiple entries"
)
class TestFDB {
  private portName1: string;
  private portName2: string;

  private mac: string = "0100.0000.0000";

  @BeforeAll
  private initPortName() {
    //port10,11 to port23
    this.portName1 = this.topo.port[2];
    this.portName2 = this.topo.port[3];
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
    `test unique muticast MAC address entry key can exist in multiple entries`
  )
  private async testConfig() {
    let macEntry1 = new MacEntry(this.portName1, this.mac, "1");
    let macEntry2 = new MacEntry(this.portName2, this.mac, "1");

    try {
      await this.addStaticMac(macEntry1);
      await this.addStaticMac(macEntry2);

      let output = await this.output("multicast");

      const matcher = output.match(
        /\d+\s+[\w\d-]+\s+[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\s+\d+\s+\d+\s+\d+/g
      );

      if (matcher) {
        let entries = matcher
          .map(entryStr => this.getEntry(entryStr))
          .filter(
            entry => entry.compare(macEntry1) || entry.compare(macEntry2)
          );
        expect(entries.length).toEqual(2);
      } else {
        expect(matcher).not.toBeNull();
      }
    } finally {
      await this.clearMacTable("multicast");
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

  private async clearMacTable(type: string) {
    await this.topo.dut.exec`
      > clear mac address-table ${type}
    `;
  }
}