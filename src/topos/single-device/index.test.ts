import { Ether, IP, Packet } from "@xtp/packet-craft";
import { Describe, InjectTopo, Test } from "../../decorators";
import { SingleDevice } from "./index";

@Describe("Test single device")
class TestSingleDevice {
  @InjectTopo
  private readonly topo: SingleDevice;

  @Test("test", 30000)
  private async test() {
    const port0 = this.topo.testStrom.port[0];
    const port1 = this.topo.testStrom.port[1];
    const backend = this.topo.testStrom.backend;
    const packet = new Packet([
      new Ether(),
      new IP({
        src: "1.1.1.1",
        dst: "2.2.2.2"
      })
    ]);

    await backend.startCapture(port1);

    try {
      // send packet
      await backend.send(packet, port0);

      // get capture data
      const caps = await backend.takeCaptureData(port1, 1);
      expect(caps.length).toBe(1);

      // match capture data
      const cap = caps[0];
      expect(cap.getLayer(IP).fields).toMatchObject({
        src: "1.1.1.1",
        dst: "2.2.2.2"
      });
    } finally {
      await backend.stopCapture(port1);
    }
  }
}
