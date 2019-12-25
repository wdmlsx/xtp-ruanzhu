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
import { DoubleDevice } from "../../../topos/double-device";
import { Dut } from "@xtp/telnet";
import { Dot1Q, Ether, IP, Packet } from "@xtp/packet-craft";

@Describe(
  "R-MIRROR-6-0070 test If the ingress traffic of aggregator is monitored, all traffic that received from the aggregator and follow [R-MIRROR-5-0021] should be monitored to specified session. The traffic coming from the aggregator should include all packets coming from the members of aggregator."
)
class TestMirrorSession {
  // private mPort3: string;
  // private mPort4: string;
  // private mPort5: string;

  private mPorts: Array<string> = new Array<string>(1);

  private dstPort: string;
  @BeforeAll
  private async init() {
    // this.mPorts[0] = this.topo.dut1.port[2];
    // this.mPorts[1] = this.topo.dut1.port[3];
    this.mPorts[0] = this.topo.dut1.port[0];

    this.dstPort = this.topo.dut1.port[1];
  }

  @InjectTopo
  private readonly topo: DoubleDevice;

  @BeforeEach
  private async beforeEach() {
    await this.topo.dut1.cli.connect();
    await this.topo.dut2.cli.connect();
  }

  @AfterEach
  private async afterEach() {
    await this.topo.dut1.cli.end();
    await this.topo.dut2.cli.end();
  }
  @Test(
    "If the ingress traffic of aggregator is monitored, all traffic that received from the aggregator and follow [R-MIRROR-5-0021] should be monitored to specified session. The traffic coming from the aggregator should include all packets coming from the members of aggregator.",
    300000
  )
  private async testConfig() {
    expect("diff speed and duplex").toBeNull();
    // console.log("mPorts: ", this.mPorts);
    // let cli = this.topo.dut1.cli;
    //
    // let aggName = await this.addLinkAgg(cli, 10, this.mPorts);
    //
    // let vids = await this.addVlans(cli, [100, 200]);
    //
    // await this.addAccessToVlan(cli, aggName, vids[0]);
    //
    // await this.addAccessToVlan(cli, this.dstPort, vids[1]);
    //
    // let sessionId = await this.addMonitorSession(cli, 1, aggName, this.dstPort);
    //
    // let testStrom = this.topo.testStrom;
    //
    // await testStrom.backend.stopCapture(testStrom.port[1]);
    //
    // await this.clearCounters(cli);
    //
    // await testStrom.backend.startCapture(testStrom.port[1]);
    // // for (let i = 1; i < 10; i++) {
    // //   let pck = new Packet([
    // //     new Ether({ src: `00:00:00:00:11:0${i}`, dst: `00:00:00:00:22:0${i}` }),
    // //     new IP()
    // //   ]);
    // //
    // //   await testStrom.backend.send(pck, testStrom.port[0]);
    // // }
    //
    // let pck = new Packet([
    //   new Ether({ src: "00:00:00:00:11:08", dst: "00:00:00:00:22:09" }),
    //   new IP()
    // ]);
    // await testStrom.backend.send(pck, testStrom.port[0]);
    // let hasError = false;
    // try {
    //   let caps = await testStrom.backend.takeCaptureData(testStrom.port[1], 1);
    //   // for (let i = 0; i < caps.length; i++) {
    //   //   console.log("Ether: ", caps[i].getLayer(Ether));
    //   //   console.log("IP: ", caps[i].getLayer(IP));
    //   // }
    //   if (caps) {
    //     console.log("Ether: ", caps[0]);
    //   }
    // } catch (e) {
    //   console.log("error: ", e.message);
    //   hasError = true;
    // } finally {
    //   await cli.safeExec`> end`;
    //
    //   await this.removeMonitorSession(cli, sessionId);
    //
    //   await this.removeVlans(cli, vids);
    //
    //   await this.removeLinkAgg(cli, this.mPorts);
    // }
    // // await this.add
    // expect(hasError).toBeFalsy();
  }

  private async addLinkAgg(
    cli: Dut,
    aggId: number,
    ports: Array<string>
  ): Promise<string> {
    await cli.exec`
      > configure terminal
    `;

    for (let i = 0; i < ports.length; i++) {
      console.log("port: ", ports[i]);
      await cli.exec`
        > interface ${ports[i]}
        > duplex full
        > channel-group ${aggId} mode active
        > exit
      `;
    }

    await cli.exec`> end`;

    return "agg" + aggId;
  }

  private async removeLinkAgg(cli: Dut, ports: Array<string>) {
    await cli.exec`
      > configure terminal
    `;

    for (let i = 0; i < ports.length; i++) {
      await cli.exec`
        > interface ${ports[i]}
        > no channel-group
        > no duplex
        > exit
      `;
    }

    await cli.exec`> end`;
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

  private async clearCounters(cli: Dut) {
    await cli.exec`> clear counters`;
  }
}
