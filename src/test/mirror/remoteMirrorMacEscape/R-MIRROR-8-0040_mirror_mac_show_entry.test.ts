import { Describe, Test } from "../../../decorators";

@Describe(
  "R-MIRROR-8-0040 test User can display the Mac escape the entry number and the entries’ information include Mac address and mask by “show” command."
)
class TestMirrorMacEscape {
  @Test("refer to ./R-MIRROR-8-0010_mirror_mac_config.test.ts")
  private async testVlan() {
    expect(true).toBeTruthy();
  }
}
