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
  "R-MIRROR-6-0020 test If a port has been mirror source port, this port should not be allowed to join in link aggregation group."
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
    "If a port has been mirror source port, this port should not be allowed to join in link aggregation group."
  )
  private async testConfig() {
    let sessionId = await this.addSrcMonitorSession(1, this.portName1);

    let hAsError = false;

    try {
      await this.addAgg(this.portName1, 1);
    } catch (e) {
      await this.topo.dut.exec`> end`;

      hAsError = true;
    } finally {
      await this.removeSession(sessionId);
    }
    expect(hAsError).toBeTruthy();
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

  private async addSrcMonitorSession(
    sessionId: number,
    portName: string
  ): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > monitor session ${sessionId} source interface ${portName}
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
