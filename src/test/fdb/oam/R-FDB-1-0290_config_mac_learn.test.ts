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

@Describe(
  "R-RDB-1-0290 test configure no mac learning enable for switch interface"
)
class TestInterface {
  private portName: string;

  private aggId: string = "1";

  @BeforeAll
  private initPortName() {
    //port 8 to port 0
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

  @Test("test config on agg menber and agg interface should be failure")
  private async testOnMemberAndAgg() {
    try {
      let aggName = await this.addPortToAgg(this.portName, this.aggId);

      let hasErrorOnMember = false;
      let hasErrorOnAgg = false;

      try {
        await this.topo.dut.exec`
          > configure terminal
          > interface ${this.portName}
          > mac learning disable
          > end
        `;
      } catch (e) {
        await this.topo.dut.exec`> end`;
        hasErrorOnMember = true;
      }

      try {
        await this.topo.dut.exec`
          > configure terminal
          > interface ${aggName}
          > mac learning disable
          > end
        `;
      } catch (e) {
        await this.topo.dut.exec`> end`;
        hasErrorOnAgg = true;
      }

      expect(hasErrorOnAgg && hasErrorOnMember).toBeTruthy();
    } finally {
      await this.reset(this.portName);
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

  private async addPortToAgg(portName: string, aggId: string): Promise<any> {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > channel-group ${aggId} mode active
      > end
    `;
    return "agg1";
  }

  private async reset(portName: string) {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > no channel-group
      > end
    `;
  }
}
