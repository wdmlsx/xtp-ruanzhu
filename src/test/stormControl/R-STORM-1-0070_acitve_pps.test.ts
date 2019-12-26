import { SingleDevice } from "../../topos/single-device";
import {
  AfterEach,
  BeforeAll,
  BeforeEach,
  Describe,
  InjectTopo,
  Test,
  TestOnly
} from "../../decorators";
import { ControlType } from "./ControlType";
import { ModeType } from "./ModeType";
import { StormEntry } from "./StormEntry";

@Describe(
  "R-STORM-1-0070 test only one mode of pps or level can be active to unicast, multicast and broadcast storm control of an interface"
)
class TestStromControl {
  private portName: string;

  private broadcast: string = ControlType[ControlType.broadcast];

  private multicast: string = ControlType[ControlType.multicast];

  private unicast: string = ControlType[ControlType.unicast];

  private pps: string = ModeType[ModeType.pps];

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

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test only one mode of pps or level can be active to broadcast")
  private async testOnBroadcast() {
    try {
      let stormLevel = await this.addStormControl(
        this.portName,
        this.broadcast,
        this.level,
        "50"
      );

      stormLevel.bMode = "Level";

      stormLevel.bLevel = "50.00";

      let stormPPS = await this.addStormControl(
        this.portName,
        this.broadcast,
        this.pps,
        "5000"
      );

      stormPPS.bMode = "PPS";

      stormPPS.bLevel = "5000";

      let output = await this.output(this.portName);

      let reg = /[\w\d-]+\s+\w+[\d.\s]+\w+[\d.\s]+\w+[\d.\s]+/g;

      let matcher = output.match(reg);

      if (matcher) matcher.shift();

      if (matcher) {
        let stormEntries = matcher
          .map(entryStr => this.getStormEntry(entryStr))

          .filter(
            entry => stormPPS.compare(entry) || stormLevel.compare(entry)
          );

        if (stormEntries.length === 1) {
          expect(stormPPS.compare(stormEntries[0])).toBeTruthy();
        } else {
          expect(stormEntries.length).toEqual(1);
        }
      } else {
        expect(matcher).not.toBeNull();
      }
    } finally {
      await this.reset(this.portName, this.broadcast);
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test only one mode of pps or level can be active to multicast")
  private async testOnMulticast() {
    try {
      let stormLevel = await this.addStormControl(
        this.portName,
        this.multicast,
        this.level,
        "50"
      );

      stormLevel.mMode = "Level";

      stormLevel.mLevel = "50.00";

      let stormPPS = await this.addStormControl(
        this.portName,
        this.multicast,
        this.pps,
        "5000"
      );

      stormPPS.mMode = "PPS";

      stormPPS.mLevel = "5000";

      let output = await this.output(this.portName);

      let reg = /[\w\d-]+\s+\w+[\d.\s]+\w+[\d.\s]+\w+[\d.\s]+/g;

      let matcher = output.match(reg);

      if (matcher) matcher.shift();

      if (matcher) {
        let stormEntries = matcher
          .map(entryStr => this.getStormEntry(entryStr))

          .filter(
            entry => stormPPS.compare(entry) || stormLevel.compare(entry)
          );

        if (stormEntries.length === 1) {
          expect(stormPPS.compare(stormEntries[0])).toBeTruthy();
        } else {
          expect(stormEntries.length).toEqual(1);
        }
      } else {
        expect(matcher).not.toBeNull();
      }
    } finally {
      await this.reset(this.portName, this.multicast);
    }
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test only one mode of pps or level can be active to unicast")
  private async testOnUnicast() {
    try {
      let stormLevel = await this.addStormControl(
        this.portName,
        this.unicast,
        this.level,
        "50"
      );

      stormLevel.uMode = "Level";

      stormLevel.uLevel = "50.00";

      let stormPPS = await this.addStormControl(
        this.portName,
        this.unicast,
        this.pps,
        "5000"
      );

      stormPPS.uMode = "PPS";

      stormPPS.uLevel = "5000";

      let output = await this.output(this.portName);

      let reg = /[\w\d-]+\s+\w+[\d.\s]+\w+[\d.\s]+\w+[\d.\s]+/g;

      let matcher = output.match(reg);

      if (matcher) matcher.shift();

      if (matcher) {
        let stormEntries = matcher
          .map(entryStr => this.getStormEntry(entryStr))

          .filter(
            entry => stormPPS.compare(entry) || stormLevel.compare(entry)
          );

        if (stormEntries.length === 1) {
          expect(stormPPS.compare(stormEntries[0])).toBeTruthy();
        } else {
          expect(stormEntries.length).toEqual(1);
        }
      } else {
        expect(matcher).not.toBeNull();
      }
    } finally {
      await this.reset(this.portName, this.unicast);
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

  private async output(portName: string): Promise<any> {
    return await this.topo.dut.exec`> show storm-control interface ${portName}`;
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
