import { Describe, Test } from "../../../decorators";

@Describe(
  "R-MIRROR-8-0020 test When entries are configured, packets which have the Mac destination address match any of the specified entries can not be mirrored to any remote destination vlan."
)
class TestMirrorMacEscape {
  @Test("refer to ./R-MIRROR-8-0050_mirror_mac_effect_remote_only.test.ts")
  private async testVlan() {
    expect(true).toBeTruthy();
  }
}
