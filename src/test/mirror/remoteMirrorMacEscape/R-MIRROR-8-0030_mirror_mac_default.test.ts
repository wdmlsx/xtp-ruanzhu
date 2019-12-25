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
  "R-MIRROR-8-0030 test By default, there are not any entries in the system."
)
class TestMirrorMacEscape {
  private portName1: string;
  private portName2: string;

  @BeforeAll
  private init() {
    this.portName1 = this.topo.port[0];
    this.portName2 = this.topo.port[1];
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

  @Test("test By default, there are not any entries in the system.")
  private async testDefault() {
    let output = await this.outputMacEscape();
    let matcher = output.match(/count\s+:\s+\d/g);
    if (matcher) {
      let count = matcher[0].match(/\d+/);
      expect(count[0]).toEqual("0");
    } else {
      !expect(matcher).not.toBeNull();
    }
  }

  //
  private async outputMacEscape(): Promise<string> {
    return await this.topo.dut.exec`
      > show monitor mac escape
    `;
  }
}
