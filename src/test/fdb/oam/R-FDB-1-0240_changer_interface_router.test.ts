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
  "R-RDB-1-0240 test mac entry will be removed if change interface mode to router"
)
class TestFDB {
  private portName: string;

  private mac: string = "0000.0000.0001";

  @BeforeAll
  private initPortName() {
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

  @Test("test change switch mode to router")
  private async testRemove() {
    try {
      //
      await this.changeToSwitch(this.portName);

      let entry1 = new MacEntry(this.portName, this.mac, "1");

      //
      await this.addMac(entry1);

      await this.changeToRouter(this.portName);

      let output = await this.output("static");

      let matcher = output.match(
        // /\d+\s+[\w\d-]+\s+0{4}\.0{4}\.0001\s+\d+\s+\d+/g
        /\d+\s+[\w\d-]+\s+[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\s+\d+\s+\d+/g
      );

      if (matcher) {
        let entries = matcher
          .map(entryStr => {
            return this.getEntry(entryStr);
          })
          .filter(entry => {
            return entry.compare(entry1);
          });
        expect(entries.length).toEqual(0);
      } else {
        !expect(matcher).toBeNull();
      }
    } finally {
      await this.changeToSwitch(this.portName);
    }
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

  private async changeToRouter(portName: string) {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > no switchport
      > end
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
