import { SingleDevice } from "../../topos/single-device";
import {
  AfterAll,
  AfterEach,
  BeforeAll,
  BeforeEach,
  Describe,
  InjectTopo,
  Test,
  TestOnly
} from "../../decorators";

@Describe(
  "R-FDB-1-0190 test config aging time of mac address entries of the system"
)
class TestFDB {
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

  @Test("test default ageing-time of system is 300")
  private async testDefaultVlaue() {
    const output = await this.topo.dut.exec`
        > show mac address-table ageing-time
      `;

    const matcher = output.match(/ageing\stime\sis\s\d+/g);

    if (matcher) {
      expect(parseInt(matcher[0].match(/\d+/g)[0])).toEqual(300);
    } else {
      expect(matcher).not.toBeNull();
    }
  }

  @Test("test ageing-time should not less than 10")
  private async testLess10() {
    let haseError = false;

    try {
      await this.topo.dut.exec`
        > configure terminal
        > mac-address-table ageing-time 9
      `;
    } catch (e) {
      haseError = true;
    } finally {
      await this.topo.dut.exec`> end`;
    }
    expect(haseError).toBeTruthy();
  }

  @Test("test ageing-time should not greater than 1 000 000")
  private async testGreater1000000() {
    let haseError = false;

    try {
      await this.topo.dut.exec`
        > configure terminal
        > mac-address-table ageing-time 1000001
      `;
    } catch (e) {
      haseError = true;
    } finally {
      await this.topo.dut.exec`> end`;
    }
    expect(haseError).toBeTruthy();
  }

  @Test("test show the ageing-time of the system")
  private async testConfig() {
    try {
      await this.topo.dut.exec`
        > configure terminal
        > mac-address-table ageing-time 500
        > end
      `;
      const output = await this.topo.dut.exec`
        > show mac address-table ageing-time
      `;

      const matcher = output.match(/ageing\stime\sis\s\d+/g);

      if (matcher) {
        expect(parseInt(matcher[0].match(/\d+/g)[0])).toEqual(500);
      } else {
        expect(matcher).not.toBeNull();
      }
    } finally {
      await this.topo.dut.exec`
        > configure terminal
        > no mac-address-table ageing-time
        > end
      `;
    }
  }
}
