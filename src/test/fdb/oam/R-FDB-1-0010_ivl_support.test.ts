import { Ether, IP, Packet } from "@xtp/packet-craft";
import { SingleDevice } from "../../../topos/single-device";
import {
  AfterEach,
  BeforeAll,
  BeforeEach,
  Describe,
  InjectTopo,
  Test
} from "../../../decorators";
import { MacEntry } from "./MacEntry";

@Describe(
  "R-RDB-1-0010 test The system only supports IVL (Independent VLAN Learning)"
)
class TestInterface {
  private portName1: string;
  private portName2: string;

  private mac: string = "0000.0000.0001";

  private vlanId: string = "100";

  @BeforeAll
  private initPortName() {
    //port 01 to port 2,3
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

  @Test("test IVL support")
  private async testConfig() {
    try {
      let testStrom = this.topo.testStrom;
      // 组包
      let packet = new Packet([
        new Ether({ src: "00:00:00:00:00:01", dst: "00:00:00:00:00:02" })
      ]);

      // 发包
      await testStrom.backend.send(packet, testStrom.port[0]);

      let macEntry = new MacEntry(this.topo.port[0], "0000.0000.0001", "1");

      let output = await this.output("dynamic");

      let matcher = output.match(
        /\d+\s+[\w\d-]+\s+[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\s+\d+\s+\d+/g
      );

      if (matcher) {
        let entries = matcher
          .map(entryStr => {
            return this.getEntry(entryStr);
          })
          .filter(entry => {
            return macEntry.compare(entry);
          });
        expect(entries.length).toEqual(1);
      } else {
        !expect(matcher).not.toBeNull();
      }
    } finally {
      await this.reset();
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

  // remove vlan 100 and clear static mac table
  private async reset() {
    await this.topo.dut.exec`
      > configure terminal
      > vlan database
      > no vlan ${this.vlanId}
      > end
      > clear mac address-table dynamic
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

    const macEntry = new MacEntry(entryArr[1], entryArr[2], entryArr[0]);
    return macEntry;
  }
}
