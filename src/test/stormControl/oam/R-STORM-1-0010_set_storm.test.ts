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
import { StormEntry } from "./StormEntry";
import { ControlType } from "./ControlType";
import { ModeType } from "./ModeType";

@Describe("R-STORM-1-0010 test storm control can be set per interface")
class TestStromControl {
  private portName: string;

  private broadcast: string = ControlType[ControlType.broadcast];

  private level: string = ModeType[ModeType.level];

  @BeforeAll
  private init() {
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

  @Test("test storm control can be configured per interface")
  private async testConfig() {
    try {
      let stormEntry = await this.addStormControl(
        this.portName,
        this.broadcast,
        this.level,
        "50"
      );

      stormEntry.bMode = "Level";

      stormEntry.bLevel = "50.00";

      let output = await this.output();

      let reg = /[\w\d-]+\s+\w+[\d.\s]+\w+[\d.\s]+\w+[\d.\s]+/g;

      let matcher = output.match(reg);

      if (matcher) matcher.shift();

      if (matcher) {
        let stormEntries = matcher
          .map(entryStr => this.getStormEntry(entryStr))

          .filter(entry => stormEntry.compare(entry));

        expect(stormEntries.length).toEqual(1);
      } else {
        expect(matcher).not.toBeNull();
      }
    } finally {
      await this.reset(this.portName, this.broadcast);
    }
  }

  private async addStormControl(
    portName: string,
    type: string,
    mode: string,
    vlaue: string
  ): Promise<StormEntry> {
    let stormEntry = new StormEntry(portName);

    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > storm-control ${type} ${mode} ${vlaue}
      > end
    `;
    return stormEntry;
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

  private async output(): Promise<any> {
    return await this.topo.dut.exec`> show storm-control`;
  }

  private async reset(portName: string, type: string) {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > no storm-control ${type} 
      > end
    `;
  }
}
