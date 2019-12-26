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

@Describe("R-RDB-1-0180 test show count mac entry")
class TestFDB {
  private portName1: string;
  private portName2: string;
  private portName3: string;
  private portName4: string;

  private mac1: string = "0000.0000.0001";
  private mac2: string = "0000.0000.0002";
  private muticastMac: string = "0100.0000.0000";
  private macEntry1: MacEntry;
  private macEntry2: MacEntry;
  private macEntry3: MacEntry;
  private macEntry4: MacEntry;
  @BeforeAll
  private async init() {
    jest.setTimeout(30000);

    await this.topo.dut.connect();
    this.portName1 = this.topo.port[0];
    this.portName2 = this.topo.port[1];
    this.portName3 = this.topo.port[2];
    this.portName4 = this.topo.port[3];

    this.macEntry1 = new MacEntry(this.portName1, this.mac1, "1");
    this.macEntry2 = new MacEntry(this.portName2, this.mac2, "1");
    this.macEntry3 = new MacEntry(this.portName3, this.muticastMac, "1");
    this.macEntry4 = new MacEntry(this.portName4, this.muticastMac, "1");

    await this.addStaticMac(this.macEntry1);
    await this.addStaticMac(this.macEntry2);
    await this.addStaticMac(this.macEntry3);
    await this.addStaticMac(this.macEntry4);
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

  /*
   * 该测试用例的测试脚本
   * @Test注解用于描述该测试用例所包含的一个测试点
   * 这里的描述文字会随着测试用例跑完后在终端输出，也会记录在测试报告中
   * */
  @Test("test show count mac entry")
  private async testCount() {
    try {
      let output = await this.topo.dut.exec`
        > show mac address-table count
      `;
      let dynamicArr = output.match(/Dynamic\sAddress\sCount\s+:\s+\d+/g);
      let unicastArr = output.match(
        /Static\sUnicast\sAddress\sCount\s+:\s+\d+/g
      );
      let multicastArr = output.match(
        /Static\sMulticast\sAddress\sCount\s+:\s+\d+/g
      );
      let totalArr = output.match(/Total\sMac\sAddresses\sCount\s+:\s+\d+/g);
      if (dynamicArr) {
        let dynamic = dynamicArr[0].match(/\d+/)[0];
        if (dynamic === "0") {
          if (unicastArr) {
            let unicast = unicastArr[0].match(/\d+/g)[0];
            if (unicast === "2") {
              if (multicastArr) {
                let muticast = multicastArr[0].match(/\d+/g)[0];
                if (muticast === "1") {
                  if (totalArr) {
                    let total = totalArr[0].match(/\d+/g)[0];
                    expect(total).toEqual("3");
                  } else {
                    expect(totalArr).not.toBeNull();
                  }
                } else {
                  expect(muticast).toEqual("1");
                }
              } else {
                expect(multicastArr).not.toBeNull();
              }
            } else {
              expect(unicast).toEqual("2");
            }
          } else {
            expect(unicastArr).not.toBeNull();
          }
        } else {
          expect(dynamic).toEqual("0");
        }
      } else {
        expect(dynamicArr).not.toBeNull();
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

  private async clearStatic() {
    await this.topo.dut.exec`
      > clear mac address-table static
      > clear mac address-table multicast
    `;
  }
}
