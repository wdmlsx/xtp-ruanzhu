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
  "R-MIRROR-6-0100 test Aggregator’s ingress traffic and egress traffic can associate with different session or same session. User can specify the session by command."
)
class TestMirrorSession {
  private portName1: string;
  private portName2: string;

  @BeforeAll
  private init() {
    this.portName1 = this.topo.port[5];
    this.portName2 = this.topo.port[6];
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
    "Aggregator’s ingress traffic and egress traffic can associate with different session or same session. User can specify the session by command."
  )
  private async testConfig() {
    let aggId = await this.addAgg(this.portName1, 1);

    let sessionId1 = await this.addSrcMonitorSessionTX(1, aggId);

    let sessionId2 = await this.addSrcMonitorSessionRX(2, aggId);
    try {
      let output1 = await this.output(sessionId1);

      let output2 = await this.output(sessionId2);

      expect(output1).toMatch("agg" + aggId);

      expect(output2).toMatch("agg" + aggId);
    } finally {
      await this.removeSession(sessionId1);

      await this.removeSession(sessionId2);

      await this.removeAgg(this.portName1);
    }
  }

  private async addAgg(portName: string, aggId): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > channel-group ${aggId} mode active
      > end
    `;
    return aggId;
  }

  private async removeAgg(portName: string) {
    await this.topo.dut.exec`
      > configure terminal
      > interface ${portName}
      > no channel-group
      > end
    `;
  }

  private async addSrcMonitorSessionRX(
    sessionId: number,
    aggId: number
  ): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > monitor session ${sessionId} source interface agg ${aggId} rx
      > end
    `;
    return sessionId;
  }

  private async addSrcMonitorSessionTX(
    sessionId: number,
    aggId: number
  ): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > monitor session ${sessionId} source interface agg ${aggId} tx
      > end
    `;
    return sessionId;
  }

  private async removeSession(sessionId: number) {
    await this.topo.dut.exec`
      > configure terminal
      > no monitor session ${sessionId}
      > end
    `;
  }

  private async output(sessionId: number): Promise<string> {
    return await this.topo.dut.exec`
      > show monitor session ${sessionId}
    `;
  }
}
