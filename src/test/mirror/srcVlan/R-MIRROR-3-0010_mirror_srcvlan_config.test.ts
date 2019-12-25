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
  "R-MIRROR-3-0010 test User can monitor traffic based on VLAN (and the VLAN which have been monitored is called as mirror source VLAN or source VLAN)"
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

  @Test("test user can monitor traffic based on port")
  private async testConfig() {
    let vlanId = await this.addVlanInterface(100);
    let sessionId = await this.addMonitorSession(1, "source", vlanId);
    try {
      let output = await this.output(sessionId);
      expect(output).toMatch(vlanId + "");
    } finally {
      await this.removeSession(sessionId);
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
