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
  "R-MIRROR-3-0070 test If a VLAN is monitored, this VLAN’s normal operation should not be interfered."
)
class TestMirrorSrcVlan {
  private portName: string;

  private vlanId: number;

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

  @Test(
    "test If a VLAN is monitored, this VLAN’s normal operation should not be interfered."
  )
  private async testConfig() {
    let vlanId = await this.addVlanInterface(100);

    let sessionId = await this.addMonitorSession(1, vlanId);

    try {
      await this.topo.dut.exec`
        > configure terminal
        > interface ${this.portName}
        > switchport access vlan 100
        > end
      `;

      let output = await this.topo.dut.exec`
        > show vlan all
      `;

      let matcher = output.match(/VLAN0100\s+ACTIVE\s+\d+\s+[\w\d-]+/g);

      if (matcher) {
        expect(matcher[0]).toMatch(this.portName);
      } else {
        expect(matcher).not.toBeNull();
      }
    } finally {
      await this.removeSession(sessionId);

      await this.removeVlan(vlanId);
    }
  }

  //
  private async removeSession(sessionId: number) {
    await this.topo.dut.exec`
      > configure terminal
      > no monitor session ${sessionId}
      > end
    `;
  }

  private async removeVlan(vlanId: number) {
    await this.topo.dut.exec`
      > configure terminal
      > vlan database
      > no vlan ${vlanId}
      > end
    `;
  }

  private async output(sessionId: number): Promise<string> {
    return await this.topo.dut.exec`
      > show monitor session ${sessionId}
    `;
  }

  private async addMonitorSession(
    sessionId: number,
    vlanId: number
  ): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > monitor session ${sessionId} source vlan ${vlanId}
      > end
    `;

    return sessionId;
  }

  private async addVlanInterface(vlanId: number): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > vlan database
      > vlan 100
      > exit
      > interface vlan 100
      > end
    `;

    return vlanId;
  }
}