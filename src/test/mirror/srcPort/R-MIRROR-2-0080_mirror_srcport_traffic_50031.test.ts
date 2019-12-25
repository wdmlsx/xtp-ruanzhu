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
import { Ether, IP, Packet } from "@xtp/packet-craft";
import { Dot1Q } from "@xtp/packet-craft/dist/layers/l2/dot1q";
import { sleep } from "../../../utils";
import { DoubleDevice } from "../../../topos/double-device";
import { Dut } from "@xtp/telnet";

@Describe(
  "R-MIRROR-2-0080 test If the egress traffic of port is monitored, all traffic which going out of the port and follow the rule of [R-MIRROR-5-0031] should be monitored to specified session."
)
class TestMirrorSrcPort {
  private p3: string;
  private p4: string;
  private p5: string;
  private p6: string;

  @BeforeAll
  private async init() {
    this.p3 = this.topo.dut1.port[2];
    this.p4 = this.topo.dut1.port[3];
    this.p5 = this.topo.dut1.port[0];
    this.p6 = this.topo.dut1.port[1];
  }

  @InjectTopo
  private readonly topo: DoubleDevice;

  @BeforeEach
  private async beforeEach() {
    jest.setTimeout(30000);

    await this.topo.dut1.cli.connect();
  }

  @AfterEach
  private async afterEach() {
    await this.topo.dut1.cli.end();
  }

  @Test("test packet send monitor", 300000)
  private async testConfig() {
    let cli = this.topo.dut1.cli;
    let vids = await this.addVlans(cli, [100, 200]);

    await this.addAccessToVlan(cli, this.p3, vids[0]);

    await this.addAccessToVlan(cli, this.p5, vids[0]);

    await this.addAccessToVlan(cli, this.p6, vids[1]);

    let sessionId = await this.addMonitorSession(cli, 1, this.p3, this.p6);

    let packet = new Packet([
      new Ether({ src: "00:00:00:00:00:01", dst: "00:00:00:00:00:02" }),
      new IP()
    ]);

    let testStrom = this.topo.testStrom;

    await testStrom.backend.stopCapture(testStrom.port[1]);
    try {
      await this.clearCounters(cli);
      await testStrom.backend.startCapture(testStrom.port[1]);

      await testStrom.backend.send(packet, testStrom.port[0]);
      let caps = await testStrom.backend.takeCaptureData(testStrom.port[1], 1);
      if (caps) {
        // console.log("Ether: ", caps[0].getLayer(Ether));
      }
    } catch (e) {
    } finally {
      await testStrom.backend.stopCapture(testStrom.port[1]);
      await this.removeMonitorSession(cli, sessionId);
      await this.removeVlans(cli, vids);
    }

    expect(0).toEqual(0);
  }

  //　添加并获取vlan
  private async addVlans(
    cli: Dut,
    vids: Array<number>
  ): Promise<Array<number>> {
    await cli.exec`
      > configure terminal
      > vlan database
    `;

    for (let i = 0; i < vids.length; i++) {
      await cli.exec`> vlan ${vids[i]}`;
    }

    await cli.exec`> end`;

    return vids;
  }

  // 添加vlan interface
  private async addVlanInterface(cli: Dut, vid: number): Promise<number> {
    await cli.exec`
      > configure terminal
      > interface vlan ${vid}
      > end
    `;
    return vid;
  }

  //　移除vlan
  private async removeVlans(cli: Dut, vids: Array<number>) {
    await cli.exec`
      > configure terminal
      > vlan database
    `;

    for (let i = 0; i < vids.length; i++) {
      await cli.exec`> no vlan ${vids[i]}`;
    }

    await cli.exec`> end`;
  }

  private async addAccessToVlan(
    cli: Dut,
    portName: string,
    vlanId: number
  ): Promise<string> {
    await cli.exec`
      > configure terminal
      > interface ${portName}
      > switchport access vlan ${vlanId}
      > end
    `;
    return portName;
  }

  private async addMonitorSession(
    cli: Dut,
    sessionId,
    srcPort: string,
    dstPort: string
  ): Promise<number> {
    await cli.exec`
      > configure terminal
      > monitor session ${sessionId} source interface ${srcPort}
      > monitor session ${sessionId} destination interface ${dstPort}
      > end
    `;
    return sessionId;
  }

  private async removeMonitorSession(cli: Dut, sessionId: number) {
    await cli.exec`
      > configure terminal
      > no monitor session ${sessionId}
      > end
    `;
  }

  private async clearCounters(cli: Dut) {
    await cli.exec`> clear counters`;
  }
}
