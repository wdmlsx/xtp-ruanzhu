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
  "R-MIRROR-4-0061 test If a port is mirror’s destination port, user can still configure this interface. But the configuration should not take effect until this port become normal port (disable mirror destination configuration)."
)
class TestMirrorDstPort {
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
    "test If a port is mirror’s destination port, user can still configure this interface. But the configuration should not take effect until this port become normal port (disable mirror destination configuration)."
  )
  private async testConfig() {
    expect("mirror destination port can not be configure").toBeNull();
    // await this.topo.dut.exec`
    //   > configure terminal
    //   > monitor session 1 destination interface ${this.dstPort}
    //   > end
    // `;
    // let hasError = false;
    // try {
    //   await this.topo.dut.exec`
    //     > configure terminal
    //     > interface ${this.dstPort}
    //     > channel-group 1 mode active
    //     > end
    //   `;
    // } catch (e) {
    //   // console.log("error: ", e.message);
    //   hasError = true;
    // } finally {
    //   await this.topo.dut.safeExec`> end`;
    //   await this.topo.dut.exec`
    //     > configure terminal
    //     > no monitor session 1
    //   `;
    // }
    // expect(hasError).toBeFalsy();
  }

  private async addMonitorSession(
    sessionId: number,
    porName: string
  ): Promise<number> {
    await this.topo.dut.exec`
      > configure terminal
      > monitor session ${sessionId} destination interface ${porName}
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
