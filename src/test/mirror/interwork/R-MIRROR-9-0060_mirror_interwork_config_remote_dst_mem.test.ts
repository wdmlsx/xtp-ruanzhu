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
import has = Reflect.has;

@Describe(
  "R-MIRROR-9-0060 User should be allowed configure mirror remote destination port on an aggression’s member port. A port which has configured as mirror remote destination port should be allowed to join the aggression. But it is not suggested to do so."
)
class TestInterwork {
  private dstPort: string;

  @BeforeAll
  private init() {
    this.dstPort = this.topo.port[0];
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

  @Test(
    "test User should not be allowed configure mirror remote destination port on an aggression port."
  )
  private async testConfig() {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${this.dstPort}
      > channel-group 1 mode active
      > end
    `;

    await this.topo.dut.exec`
      > configure terminal
      > vlan database
      > vlan 100
      > exit
      > interface vlan 100
      > end
    `;

    try {
      await this.topo.dut.exec`
        > configure terminal
        > monitor session 1 destination remote vlan 100 interface ${this.dstPort}
        > end
      `;

      let output = await this.topo.dut.exec`
        > show monitor session 1
      `;
      expect(output).toMatch(this.dstPort);
      let hasError = false;
    } finally {
      // await th
      await this.topo.dut.exec`
        > configure terminal
        > no monitor session 1
        > interface ${this.dstPort}
        > no channel-group
        > exit
        > vlan database
        > no vlan 100
        > end
      `;
    }
  }

  @Test(
    "test port can be add to agg member which has been add monitor session remote destination"
  )
  private async testConifgJoin() {
    await this.topo.dut.exec`
      > configure terminal
      > vlan database
      > vlan 100
      > exit
      > interface vlan 100
      > end
    `;
    await this.topo.dut.exec`
      > configure terminal
      > monitor session 1 destination remote vlan 100 interface ${this.dstPort}
      > end
    `;
    let hasError = false;
    try {
      await this.topo.dut.exec`
        > configure terminal
        > interface ${this.dstPort}
        > channel-group 1 mode active
        > end
      `;
    } catch (e) {
      hasError = true;
    } finally {
      await this.topo.dut.exec`
        > configure terminal
        > no monitor session 1
        > interface ${this.dstPort}
        > no channel-group
        > exit
        > vlan database
        > no vlan 100
        > end
      `;
    }
    expect(hasError).toBeFalsy();
  }
}
