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
import { awaitExpression, numberLiteralTypeAnnotation } from "@babel/types";

@Describe(
  "R-MIRROR-3-0050 test VLAN’s ingress traffic and egress traffic can associate with different session or same session. User can specify the session by command."
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

  @Test(
    "test VLAN’s ingress traffic and egress traffic can associate with different session or same session. User can specify the session by command."
  )
  private async testConfig() {
    let vlanId = await this.addVlanInterface(100);
    try {
      await this.topo.dut.exec`
        > configure terminal
        > monitor session 1 source vlan ${vlanId} tx
        > end
      `;
      await this.topo.dut.exec`
        > configure terminal
        > monitor session 2 source vlan ${vlanId} rx
        > end
      `;
      let output1 = await this.topo.dut.exec`
        > show monitor session 1
      `;

      let output2 = await this.topo.dut.exec`
        > show monitor session 2
      `;

      let matcher1 = output1.match(/Transmit\sOnly\s+:\s+100/g);

      let matcher2 = output2.match(/Receive\sOnly\s+:\s+100/g);
      expect(matcher1).not.toBeNull();
      expect(matcher2).not.toBeNull();
    } finally {
      await this.removeSession(1);
      await this.removeSession(2);
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
    direction: string,
    vlanId: number
  ): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > monitor session ${sessionId} ${direction} vlan ${vlanId}
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