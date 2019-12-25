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
  "R-RDB-1-0140 test clear all static mac entries of system which should not clear mulicast address entries"
)
class TestFDB {
  private portName1: string;
  private portName2: string;
  private portName3: string;
  private portName4: string;
  private portName5: string;

  private mac1: string = "0000.0000.0001";
  private mac2: string = "0000.0000.0002";
  private mac3: string = "0000.0000.0003";
  private mac4: string = "0000.0000.0004";
  private mac5: string = "0000.0000.0005";

  private multiMac: string = "0100.0000.0000";
  // private portName6: string;
  // private portName7: string;

  private macEntry1: MacEntry;
  private macEntry2: MacEntry;
  private macEntry3: MacEntry;
  private macEntry4: MacEntry;
  private macEntry5: MacEntry;
  private macEntry6: MacEntry;
  //private macEntry7: MacEntry;

  @BeforeAll
  private async init() {
    this.portName1 = this.topo.port[0];
    this.portName2 = this.topo.port[1];
    this.portName3 = this.topo.port[2];
    this.portName4 = this.topo.port[3];
    this.portName5 = this.topo.port[4];
    // this.portName6 = this.topo.port[5];
    // this.portName7 = this.topo.port[6];

    this.macEntry1 = new MacEntry(this.portName1, this.mac1, "1");
    this.macEntry2 = new MacEntry(this.portName2, this.mac2, "1");
    this.macEntry3 = new MacEntry(this.portName3, this.mac3, "1");
    this.macEntry4 = new MacEntry(this.portName4, this.mac4, "1");
    this.macEntry5 = new MacEntry(this.portName5, this.mac5, "1");

    this.macEntry6 = new MacEntry(this.portName1, this.multiMac, "1");
    //   this.macEntry7 = new MacEntry(this.portName2, this.multiMac, "1");
  }

  @InjectTopo
  private readonly topo: SingleDevice;

  @BeforeEach
  private async beforeEach() {
    jest.setTimeout(30000);

    await this.topo.dut.connect();

    await this.addStaticMac(this.macEntry1);
    await this.addStaticMac(this.macEntry2);
    await this.addStaticMac(this.macEntry3);
    await this.addStaticMac(this.macEntry4);
    await this.addStaticMac(this.macEntry5);

    await this.addStaticMac(this.macEntry6);
    // await this.addStaticMac(this.macEntry7);
  }

  @AfterEach
  private async afterEach() {
    await this.topo.dut.end();
  }

  @Test(
    "test clear all static mac address entry and can not clear multicast mac entry"
  )
  private async testClearAll() {
    try {
      // clear all mac entry
      await this.topo.dut.exec`
        > clear mac address-table static
      `;

      const output = await this.output("static");

      const matcher = output.match(
        /\d+\s+[\w\d-]+\s+[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\s+\d+\s+\d+\s+\d+/g
      );

      if (matcher) {
        let entries = matcher
          .map(entryStr => this.getEntry(entryStr))
          .filter(
            entry =>
              entry.compare(this.macEntry1) ||
              entry.compare(this.macEntry2) ||
              entry.compare(this.macEntry3) ||
              entry.compare(this.macEntry4) ||
              entry.compare(this.macEntry5) ||
              entry.compare(this.macEntry6)
            //       entry.compare(this.macEntry7)
          );
        if (entries.length === 2) {
          let multiplEntries = entries.filter(entry =>
            entry.compare(this.macEntry6)
          );
          expect(multiplEntries.length).toEqual(2);
        } else {
          expect(entries.length).toEqual(1);
        }
      } else {
        expect(matcher).not.toBeNull();
      }
    } finally {
      await this.clearStatic();
    }
  }

  @Test(
    "test clear static mac address entry on interface and can not clear multicast mac entry"
  )
  private async testClearOneOnInterface() {
    try {
      //
      await this.topo.dut.exec`
        > clear mac address-table static interface ${this.portName1}
      `;
      //
      const output = await this.output("static");

      const matcher = output.match(
        /\d+\s+[\w\d-]+\s+[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\s+\d+\s+\d+\s+\d+/g
      );

      if (matcher) {
        let entries = matcher
          .map(entryStr => this.getEntry(entryStr))
          .filter(entry => entry.compare(this.macEntry1));
        if (entries.length === 0) {
          let muticastEntries = matcher
            .map(entryStr => this.getEntry(entryStr))
            .filter(entry => entry.compare(this.macEntry6));
          expect(muticastEntries.length).toEqual(1);
        } else {
          expect(entries.length).toEqual(0);
        }
      } else {
        expect(matcher).not.toBeNull();
      }
    } finally {
      await this.clearStatic();
    }
  }

  @Test(
    "test clear static mac address entry on vlan and can not clear multicast mac entry"
  )
  private async testClearOneOnVlan() {
    try {
      await this.topo.dut.exec`
        > clear mac address-table static vlan 1
      `;

      const output = await this.output("static");

      const matcher = output.match(
        /\d+\s+[\w\d-]+\s+[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\s+\d+\s+\d+\s+\d+/g
      );

      if (matcher) {
        let entries = matcher
          .map(entryStr => this.getEntry(entryStr))
          .filter(
            entry =>
              entry.compare(this.macEntry1) ||
              entry.compare(this.macEntry2) ||
              entry.compare(this.macEntry3) ||
              entry.compare(this.macEntry4) ||
              entry.compare(this.macEntry5) ||
              entry.compare(this.macEntry6)
            //    entry.compare(this.macEntry7)
          );
        if (entries.length === 2) {
          let multiplEntries = entries.filter(entry =>
            entry.compare(this.macEntry6)
          );
          expect(multiplEntries.length).toEqual(2);
        } else {
          expect(entries.length).toEqual(1);
        }
      } else {
        expect(matcher).not.toBeNull();
      }
    } finally {
      await this.clearStatic();
    }
  }

  @Test("test clear static mac address entry on mac")
  private async testClearOneOnMac() {
    try {
      //
      await this.topo.dut.exec`
        > clear mac address-table static address ${this.mac1}
      `;
      //
      const output = await this.output("static");

      const matcher = output.match(
        /\d+\s+[\w\d-]+\s+[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\s+\d+\s+\d+\s+\d+/g
      );
      if (matcher) {
        let entries = matcher
          .map(entryStr => this.getEntry(entryStr))
          .filter(entry => entry.compare(this.macEntry1));
        if (entries.length === 0) {
          let multicastEntries = matcher
            .map(entryStr => this.getEntry(entryStr))
            .filter(entry => entry.compare(this.macEntry6));
          expect(multicastEntries.length).toEqual(1);
        } else {
          expect(entries.length).toEqual(0);
        }
      } else {
        expect(matcher).not.toBeNull();
      }
    } finally {
      await this.clearStatic();
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

  private async clearStatic() {
    await this.topo.dut.exec`
      > clear mac address-table static
      > clear mac address-table multicast
    `;
  }
}
