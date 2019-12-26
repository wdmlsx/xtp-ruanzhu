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

@Describe(
  "R-RDB-1-0210 test remove interface from vlan and static mac table should clear this entry"
)
class TestInterface {
  private portName: string;

  private mac: string = "0000.0000.0001";

  private vlanId: string = "100";

  /*
   * @BeforeAll注解会在所有@Test注解的测试方法前运行，
   * 只运行一次
   * 用于初始化一些数据
   * */
  @BeforeAll
  private initPortName() {
    //port9 to port0
    this.portName = this.topo.port[2];
  }

  /*
   * @InjectTopo 注解用于给该测试类注入拓扑
   * 初始化该类时注入虚拟拓扑
   * */
  @InjectTopo
  private readonly topo: SingleDevice;

  /*
   * 从拓扑中获取设备并进行链接
   * 每个测试例被执行前都将执行该方法，链接设备
   * @BeforeEach　注解会在每一个　@Test注解的测试方法执行前运行
   * */
  @BeforeEach
  private async beforeEach() {
    jest.setTimeout(30000);

    await this.topo.dut.connect();
  }

  /*
   * 每个测试用例跑完都断开设备连接
   * 因为每台设备允许的telnet最多链接数是有限的
   * @AfterEach　注解会在每一个　@Test注解的测试方法执行后执行
   * */
  @AfterEach
  private async afterEach() {
    await this.topo.dut.end();
  }

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test config static mac address entry")
  private async testRemove() {
    try {
      //
      await this.changeToSwitch(this.portName);
      let entry1 = new MacEntry(this.portName, this.mac, "1");
      let entry2 = new MacEntry(this.portName, this.mac, this.vlanId);

      //
      await this.addMac(entry1);
      //
      await this.addVlan(this.vlanId);
      //
      await this.changeNativeVlan(this.portName, this.vlanId);
      let output = await this.output("static");
      let matcher = output.match(
        /\d+\s+[\w\d-]+\s+[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\s+\d+\s+\d+/g
      );
      if (matcher) {
        let entries = matcher
          .map(entryStr => {
            return this.getEntry(entryStr);
          })
          .filter(entry => {
            return entry.compare(entry1) || entry.compare(entry2);
          });
        console.log("entries: ", entries);
        expect(entries.length).toEqual(0);
      } else {
        !expect(matcher).toBeNull();
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
      > clear mac address-table static
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
  private async changeNativeVlan(portName: string, vlanId: string) {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > switchport access vlan ${this.vlanId}
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
