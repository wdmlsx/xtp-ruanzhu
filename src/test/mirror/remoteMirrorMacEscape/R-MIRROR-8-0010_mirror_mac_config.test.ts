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
  "R-MIRROR-8-0010 test User can set the Mac escape entries. A Mac escape entry includes a Mac address and mask. User can specify at most two entries."
)
class TestMirrorMacEscape {
  private portName1: string;
  private portName2: string;
  private portName3: string;

  @BeforeAll
  private async init() {
    this.portName1 = this.topo.port[10];
    this.portName2 = this.topo.port[11];
    this.portName3 = this.topo.port[12];
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

  @Test("test add a mac escape entry")
  private async testConfig() {
    let output1 = await this.topo.dut.exec`
      > show interface ${this.portName1}
    `;
    let matcher1 = output1.match(
      /[a-fA-F\d]{4}\.[a-fA-F\d]{4}\.[a-fA-F\d]{4}/g
    );
    if (matcher1) {
      try {
        let mac1 = matcher1[0];

        await this.addMacEscape(mac1);

        let output = await this.outputMacEscape();

        let macMatcher = output.match(/count\s+:\s+\d/g);
        expect(macMatcher[0]).toMatch("1");
      } finally {
        await this.removeMacEscape();
      }
    } else {
      expect(matcher1).not.toBeNull();
    }
  }

  @Test("test user can config mac escape at most 2")
  private async testLimit() {
    let mac1 = await this.getPortMac(this.portName1);
    let mac2 = await this.getPortMac(this.portName2);
    let mac3 = await this.getPortMac(this.portName3);

    await this.addMacEscape(mac1);
    await this.addMacEscape(mac2);

    let hasError = false;

    try {
      await this.addMacEscape(mac3);
    } catch (e) {
      hasError = true;
    } finally {
      await this.topo.dut.safeExec`> end`;
      await this.removeMacEscape();
    }

    expect(hasError).toBeTruthy();
  }

  //
  private async getPortMac(portName: string): Promise<string> {
    let output = await this.topo.dut.exec`
      > show interface ${portName}
    `;

    let matcher = output.match(/[a-fA-F\d]{4}\.[a-fA-F\d]{4}\.[a-fA-F\d]{4}/g);

    // console.log(portName, ": ", matcher);
    return matcher[0];
  }

  private async addMacEscape(mac: string) {
    await this.topo.dut.exec`
      > configure terminal
    `;

    await this.topo.dut.exec`
      > monitor mac escape ${mac} ffff.ffff.ffff
    `;

    await this.topo.dut.exec`> end`;
  }

  private async removeMacEscape() {
    await this.topo.dut.exec`
      > configure terminal
      > no monitor mac escape
      > end
    `;
  }

  private async outputMacEscape(): Promise<string> {
    return await this.topo.dut.exec`
      > show monitor mac escape
    `;
  }
}
