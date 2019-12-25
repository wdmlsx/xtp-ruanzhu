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
  "R-MIRROR-6-0040 test System should support any number of source aggregators ( up to the maximum number of available aggregators on the system) for any session."
)
class TestMirrorSession {
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
    "System should support any number of source aggregators ( up to the maximum number of available aggregators on the system) for any session."
  )
  private async testConfig() {
    let portMap = this.topo.port;
    //
    let count = 0;

    let start: string;
    // add agg
    for (let i = portMap.count + 1; i > 1; i--) {
      let hasError = false;
      try {
        await this.addAgg(portMap[i - 2], portMap.count - i + 2);
        count++;
        start = portMap[i - 2];
        // console.log("port: ", portMap[i - 2]);
      } catch (e) {
        await this.topo.dut.exec`> end`;

        hasError = true;
      }
      if (hasError) break;
    }

    // add all agg to session 1
    try {
      for (let i = 1; i < count + 1; i++) {
        await this.addSrcMonitorSession(1, i);
      }

      let output = await this.output(1);

      // verify all agg
      for (let i = 1; i < count; i++) {
        expect(output).toMatch("agg" + i);
      }
    } finally {
      await this.removeSession(1);

      await this.removeAgg(start, portMap.count);
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

  private async removeAgg(portName: string, count: number) {
    await this.topo.dut.exec`
      > configure terminal
      > interface range ${portName} - ${count}
      > no channel-group
      > end
    `;
  }

  private async addSrcMonitorSession(
    sessionId: number,
    aggId: number
  ): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > monitor session ${sessionId} source interface agg ${aggId}
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
