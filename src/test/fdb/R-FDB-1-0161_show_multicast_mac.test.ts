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
import { MacEntry } from "./MacEntry";

@Describe("R-RDB-1-0161 test show all mulicast mac entries")
class TestFDB {
  private portName1: string;
  private portName2: string;
  private portName3: string;

  private multiMac: string = "0100.0000.0000";

  private macEntry1: MacEntry;
  private macEntry2: MacEntry;
  private macEntry3: MacEntry;

  @BeforeAll
  private async init() {
    jest.setTimeout(30000);

    await this.topo.dut.connect();

    this.portName1 = this.topo.port[0];
    this.portName2 = this.topo.port[1];
    this.portName3 = this.topo.port[2];

    this.macEntry1 = new MacEntry(this.portName1, this.multiMac, "1");
    this.macEntry2 = new MacEntry(this.portName2, this.multiMac, "1");
    this.macEntry3 = new MacEntry(this.portName3, this.multiMac, "1");

    await this.addMac(this.macEntry1);
    await this.addMac(this.macEntry2);
    await this.addMac(this.macEntry3);

    await this.topo.dut.end();
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

  @AfterAll
  private async afterALl() {
    jest.setTimeout(30000);

    await this.topo.dut.connect();
    await this.topo.dut.exec`
      > clear mac address-table multicast
    `;
    await this.topo.dut.end();
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test show all static mac entry")
  private async testShowAll() {
    let output = await this.topo.dut.exec`
      > show mac address-table static
    `;

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
          return (
            entry.compare(this.macEntry1) ||
            entry.compare(this.macEntry2) ||
            entry.compare(this.macEntry3)
          );
        });
      expect(entries.length).toEqual(3);
    } else {
      expect(matcher).not.toBeNull();
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test show static mac entry of interface")
  private async testShowOfInterface() {
    let output = await this.topo.dut.exec`
      > show mac address-table static interface ${this.portName1}
    `;

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
          return entry.compare(this.macEntry1);
        });
      expect(entries.length).toEqual(1);
    } else {
      expect(matcher).not.toBeNull();
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test show static mac entry of vlan")
  private async testShowOfVlan() {
    let output = await this.topo.dut.exec`
      > show mac address-table static vlan 1
    `;

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
          return entry.vlanId === "1";
        });
      expect(entries.length).toEqual(3);
    } else {
      expect(matcher).not.toBeNull();
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test show static mac entry of mac")
  private async testShowOfMac() {
    let output = await this.topo.dut.exec`
      > show mac address-table static address ${this.multiMac}
    `;

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
          return entry.mac === this.multiMac;
        });
      expect(entries.length).toEqual(3);
    } else {
      expect(matcher).not.toBeNull();
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

  // add a static mac
  private async addMac(entry: MacEntry) {
    await this.topo.dut.exec`
      > configure terminal
      > mac-address-table ${entry.mac} forward ${entry.portName} vlan ${entry.vlanId}
      > end
    `;
  }

  // get a mac entry from matcher
  private getEntry(entry: string): MacEntry {
    // vlanId portName macAdr fwd static security
    const entryArr = entry.split(" ").filter(ele => ele !== "");

    if (entryArr.length < 5) return null;

    const macEntry = new MacEntry(entryArr[1], entryArr[2], entryArr[0]);
    macEntry.forwarding = entryArr[3];
    macEntry.static = entryArr[4];
    return macEntry;
  }
}
