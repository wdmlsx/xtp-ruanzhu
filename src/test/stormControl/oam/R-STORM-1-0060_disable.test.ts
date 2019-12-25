import { Describe, Test } from "../../../decorators";

@Describe("R-VLAN-1-0060 remove vlan")
class TestStromControl {
  @Test("refer to ./R-STORM-1-0040_enable_level.test.ts")
  private async testDisabledLevel() {
    expect(true).toBeTruthy();
  }

  @Test("refer to ./R-STORM-1-0050_enable_pps.test.ts")
  private async testDisabledPPS() {
    expect(true).toBeTruthy();
  }
}
// import { SingleDevice } from "../../../../../topos/single-device";
// import {
//   AfterEach,
//   BeforeAll,
//   BeforeEach,
//   Describe,
//   InjectTopo,
//   Test,
//   TestOnly
// } from "../../../../../decorators";
//
// @Describe(
//   "R-STORM-1-0060 test storm control can be disabled to not limit L2 unicast, multicast, broadcast streams respectively"
// )
// class TestStromControl {
//   @InjectTopo
//   private readonly topo: SingleDevice;
//
//   @BeforeEach
//   private async beforeEach() {
//     jest.setTimeout(30000);
//
//     await this.topo.dut.connect();
//   }
//
//   @AfterEach
//   private async afterEach() {
//     await this.topo.dut.end();
//   }
//
//   @Test(
//     "test static mac address entry should not prevent packet with the MAC SA of the entry into the system from other port"
//   )
//   private async testConfig() {
//     expect("mac sa").toBeNull();
//   }
// }
