import { SingleDevice } from "../../topos/single-device";
import {
  AfterEach,
  BeforeAll,
  BeforeEach,
  Describe,
  InjectTopo,
  Test,
  TestOnly
} from "../../decorators";

@Describe(
  "R-STORM-1-0020 test strom control can only be set on aggregation member interface, disabled by default"
)
class TestStromControl {
  private portName: string;

  @BeforeAll
  private init() {
    this.portName = this.topo.port[0];
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

  @Test("test storm control can only be set on switch interface")
  private async testConfig() {
    try {
      await this.topo.dut.exec`
        > configure terminal
        > interface ${this.portName}
        > no switchport
        > end
      `;
      let hasError = false;
      try {
        await this.topo.dut.exec`
          > configure terminal
          > interface ${this.portName} 
          > storm-control broadcast level 50
          > end
        `;
      } catch {
        await this.topo.dut.exec`> end`;
        hasError = true;
      }
      expect(hasError).toBeTruthy();
    } finally {
      await this.topo.dut.exec`
        > configure terminal
        > interface ${this.portName}
        > switchport
        > end
      `;
    }
  }

  @Test("test storm control should be disabled by default")
  private async testDefault() {
    let output = await this.topo.dut.exec`
      > show running-config interface ${this.portName}
    `;

    let matcher = output.match(/storm-control/g);

    expect(matcher).toBeNull();
  }
}
