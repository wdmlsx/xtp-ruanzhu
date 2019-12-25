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
  "R-MIRROR-4-0070 test If mirror destination configure disabled on the destination port, all configuration on this port should take effect automatically. That means this port become a normal port again."
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
    "test If mirror destination configure disabled on the destination port, all configuration on this port should take effect automatically. That means this port become a normal port again."
  )
  private async testConfig() {
    expect("mirror destination port can not be configure").toBeNull();
    // await this.topo.dut.exec`
    //   > configure terminal
    //   > monitor session 1 destination interface ${this.dstPort}
    //   > end
    // `;
    // let hasError1 = false;
    // try {
    //   await this.topo.dut.exec`
    //     > configure terminal
    //     > interface ${this.dstPort}
    //     > channel-group 1 mode active
    //     > end
    //   `;
    // } catch (e) {
    //   // console.log("error: ", e.message);
    //   hasError1 = true;
    // } finally {
    //   await this.topo.dut.safeExec`> end`;
    // }
    //
    // await this.topo.dut.exec`
    //     > configure terminal
    //     > no monitor session 1
    //     > end
    //   `;
    //
    // let hasError2 = false;
    // try {
    //   await this.topo.dut.exec`
    //       > configure terminal
    //       > interface ${this.dstPort}
    //       > channel-group 1 mode active
    //       > end
    //     `;
    // } catch (e) {
    //   hasError2 = true;
    // } finally {
    //   await this.topo.dut.exec`
    //     > configure terminal
    //     > no channel-group
    //     > end
    //   `;
    // }
    //
    // expect(hasError1).toBeTruthy();
    // expect(hasError2).toBeFalsy();
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
