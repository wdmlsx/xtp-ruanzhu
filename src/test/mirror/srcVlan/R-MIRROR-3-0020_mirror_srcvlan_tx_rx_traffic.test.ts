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
  "R-MIRROR-3-0020 test Traffic of source VLAN should include ingress and egress traffic of VLAN"
)
class TestMirrorSrcVlan {
  private vlanId: number;

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

  @Test("test config ingress")
  private async testIngress() {
    let vlanId = await this.addVlanInterface(100);

    await this.topo.dut.exec`
      > configure terminal
      > monitor session 1 source vlan 100 tx
      > end
    `;

    try {
      let output = await this.output(1);

      let matcher = output.match(/Transmit\sOnly\s+:\s+100/g);

      !expect(matcher).not.toBeNull();
    } finally {
      await this.removeSession(1);

      await this.removeVlan(vlanId);
    }
  }

  @Test("test config egress")
  private async testEgress() {
    let vlanId = await this.addVlanInterface(100);

    await this.topo.dut.exec`
      > configure terminal
      > monitor session 1 source vlan 100 rx
      > end
    `;

    try {
      let output = await this.output(1);

      let matcher = output.match(/Receive\sOnly\s+:\s+100/g);

      !expect(matcher).not.toBeNull();
    } finally {
      await this.removeSession(1);

      await this.removeVlan(vlanId);
    }
  }
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
