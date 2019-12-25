import { SingleDevice } from "../../../topos/single-device";
import { MacEntry } from "./MacEntry";
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
  "R-RDB-1-0090 test  User can not remove one dynamic MAC address entry with no static MAC address command."
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

  @Test("test remove dynamic mac address entry is not alowed")
  private async testRemove() {
    expect("dynamic").toBeNull();
    // // get a dynamic mac info
    // let got = false;
    //
    // let entry: MacEntry;
    //
    // while (!got) {
    //   const output = await this.topo.dut.exec`
    //     > show mac address-table
    //   `;
    //
    //   const matcher = output.match(
    //     /\d+\s+[\w\d-]+\s+[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\s+\d+\s+\d+/g
    //   );
    //
    //   if (matcher) {
    //     for (let i = 0; i < matcher.length; i++) {
    //       entry = this.getInfo(matcher[i]);
    //       if (entry) {
    //         got = true;
    //         break;
    //       }
    //     }
    //   }
    // }
    //
    // let hasError = false;
    // try {
    //   await this.topo.dut.exec`
    //     > configure terminal
    //     > no mac-address-table ${entry.mac} forward ${entry.portName} vlan ${entry.vlanId}
    //     > end
    //   `;
    // } catch (e) {
    //   hasError = true;
    // } finally {
    //   await this.topo.dut.exec`> end`;
    // }
    //
    // expect(hasError).toBeTruthy();
  }

  private getInfo(entry: string): MacEntry {
    // vlanId portName macAdr fwd static security
    const entryArr = entry.split(" ").filter(ele => ele !== "");

    if (entryArr.length < 5) return null;

    if (entryArr[4] !== "0") return null;

    const macEntry = new MacEntry(entryArr[1], entryArr[2], entryArr[0]);
    // macEntry.vlanId = entryArr[0];
    // macEntry.portName = entryArr[1];
    // macEntry.mac = entryArr[2];
    return macEntry;
  }
}
