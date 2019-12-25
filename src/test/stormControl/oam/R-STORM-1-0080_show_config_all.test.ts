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
import { ControlType } from "./ControlType";
import { ModeType } from "./ModeType";
import { StormEntry } from "./StormEntry";

@Describe(
  "R-STORM-1-0080 test user can show storm control configurations of all switch interfaces"
)
class TestStromControl {
  private portName1: string;
  private portName2: string;
  private portName3: string;
  private portName4: string;

  private broadcast: string = ControlType[ControlType.broadcast];
  private unicast: string = ControlType[ControlType.unicast];
  private multicast: string = ControlType[ControlType.multicast];

  private pps: string = ModeType[ModeType.pps];
  private level: string = ModeType[ModeType.level];

  @BeforeAll
  private init() {
    this.portName1 = this.topo.port[0];
    this.portName2 = this.topo.port[1];
    this.portName3 = this.topo.port[2];
    this.portName4 = this.topo.port[3];
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

  @Test("test show storm control configurations of all switch interface")
  private async testConfig() {
    try {
      // interface 1
      let entry1 = new StormEntry(this.portName1);

      entry1.uMode = "PPS";
      entry1.uLevel = "10000";

      await this.addStormControl(
        this.portName1,
        this.unicast,
        this.pps,
        "10000"
      );

      entry1.mMode = "PPS";
      entry1.mLevel = "10000";

      await this.addStormControl(
        this.portName1,
        this.multicast,
        this.pps,
        "10000"
      );

      entry1.bMode = "PPS";
      entry1.bLevel = "10000";

      await this.addStormControl(
        this.portName1,
        this.broadcast,
        this.pps,
        "10000"
      );

      // interface 2
      let entry2 = new StormEntry(this.portName2);

      entry2.bMode = "Level";
      entry2.bLevel = "50.05";

      await this.addStormControl(
        this.portName2,
        this.broadcast,
        this.level,
        "50.05"
      );

      entry2.uMode = "Level";
      entry2.uLevel = "40.05";

      await this.addStormControl(
        this.portName2,
        this.unicast,
        this.level,
        "40.05"
      );

      // interface 3
      let entry3 = new StormEntry(this.portName3);

      entry3.mMode = "Level";
      entry3.mLevel = "30.05";

      await this.addStormControl(
        this.portName3,
        this.multicast,
        this.level,
        "30.05"
      );

      let output = await this.output();

      let reg = /[\w\d-]+\s+\w+[\d.\s]+\w+[\d.\s]+\w+[\d.\s]+/g;

      let matcher = output.match(reg);

      if (matcher) matcher.shift();

      if (matcher) {
        let stormEntries = matcher
          .map(entryStr => this.getStormEntry(entryStr))

          .filter(
            stormEntry =>
              entry1.compare(stormEntry) ||
              entry2.compare(stormEntry) ||
              entry3.compare(stormEntry)
          );

        expect(stormEntries.length).toEqual(3);
      } else {
        expect(matcher).not.toBeNull();
      }
    } finally {
      await this.reset(this.portName1, this.broadcast);
      await this.reset(this.portName1, this.unicast);
      await this.reset(this.portName1, this.multicast);

      await this.reset(this.portName2, this.broadcast);
      await this.reset(this.portName2, this.unicast);
      await this.reset(this.portName2, this.multicast);

      await this.reset(this.portName3, this.unicast);
      await this.reset(this.portName3, this.broadcast);
      await this.reset(this.portName3, this.multicast);
    }
  }

  private async addStormControl(
    portName: string,
    type: string,
    mode: string,
    vlaue: string
  ) {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > storm-control ${type} ${mode} ${vlaue}
      > end
    `;
  }

  private async reset(portName: string, type: string) {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > no storm-control ${type} 
      > end
    `;
  }

  private async output(): Promise<any> {
    return await this.topo.dut.exec`> show storm-control`;
  }

  private getStormEntry(entryStr): StormEntry {
    // console.log("entryStr: ", entryStr);
    let entryArr = entryStr
      .split(" ")
      .filter(ele => ele != "" && ele != "\n")
      .reduce((pre, cur) => {
        if (cur === "Disable") {
          pre.push(cur);
          pre.push("");
        } else {
          pre.push(cur);
        }
        return pre;
      }, []);
    if (entryArr.length > 0) {
      let stormEntry = new StormEntry(entryArr[0]);

      stormEntry.uMode = entryArr[1];
      stormEntry.uLevel = entryArr[2];
      stormEntry.bMode = entryArr[3];
      stormEntry.bLevel = entryArr[4];
      stormEntry.mMode = entryArr[5];
      stormEntry.mLevel = entryArr[6];

      return stormEntry;
    } else {
      return null;
    }
  }
}
