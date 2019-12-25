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
import { Dot1Q, Ether, IP, Packet } from "@xtp/packet-craft";
import { Dut } from "@xtp/telnet";
import { DoubleDevice } from "../../../topos/double-device";

@Describe(
  "R-MIRROR-8-0050 test The Mac escape feature only effect on the remote mirror session. The feature will not effect the local mirror’s session."
)
class TestMirrorMacEscape {
  private srcPort_single: string;
  private dstPort_single: string;

  @BeforeAll
  private async init() {
    this.srcPort_single = this.topo.dut1.port[0];
    this.dstPort_single = this.topo.dut1.port[1];
  }

  @InjectTopo
  private readonly topo_single: SingleDevice;

  @InjectTopo
  private readonly topo: DoubleDevice;

  @BeforeEach
  private async beforeEach() {
    jest.setTimeout(30000);
    await this.topo.dut1.cli.connect();
    await this.topo.dut2.cli.connect();
  }

  @AfterEach
  private async afterEach() {
    await this.topo.dut1.cli.end();
    await this.topo.dut2.cli.end();
  }

  @Test("test in local monitor session")
  private async testLocal() {
    try {
      let mac_src_single = await this.getPortMac(this.srcPort_single);
      await this.addMacEscape(mac_src_single);
      let output = await this.outputMacEscape();

      let macReg = output.match(
        /[a-fA-F\d]{2}:[a-fA-F\d]{2}:[a-fA-F\d]{2}:[a-fA-F\d]{2}:[a-fA-F\d]{2}:[a-fA-F\d]{2}/g
      )[0];

      await this.topo.dut1.cli.exec`
        > configure terminal
        > vlan database
        > vlan 100
        > vlan 200
        > end
      `;

      await this.topo.dut1.cli.exec`
        > configure terminal
        > interface ${this.srcPort_single}
        > switchport access vlan 100
        > exit
        > interface ${this.dstPort_single}
        > switchport access vlan 200
        > end
      `;

      if (macReg) {
        await this.topo.dut1.cli.exec`
          > configure terminal
          > monitor session 1 source interface ${this.srcPort_single}
          > monitor session 1 destination interface ${this.dstPort_single}
          > end
        `;

        let packet = new Packet([
          new Ether({ src: "00:00:00:00:00:01", dst: macReg }),
          new IP()
        ]);

        await this.topo.dut1.cli.exec`> clear counters`;

        let testStrom = this.topo.testStrom;

        await testStrom.backend.stopCapture(testStrom.port[1]);

        await testStrom.backend.startCapture(testStrom.port[1]);

        await testStrom.backend.send(packet, testStrom.port[0]);

        let hasError = false;

        try {
          let cap = await testStrom.backend.takeCaptureData(
            testStrom.port[1],
            1
          );

          expect(cap[0].getLayer(Ether).fields).toMatchObject({
            src: "00:00:00:00:00:01",
            dst: macReg
          });
        } catch (e) {
          hasError = true;
        }

        expect(hasError).toBeFalsy();
      } else {
        !expect(macReg).not.toBeUndefined();
      }
    } finally {
      await this.topo.dut1.cli.exec`
            > configure terminal
            > no monitor session 1
            > end
          `;
      await this.removeVlan(this.topo.dut1.cli, [100, 200]);
      await this.removeMacEscape();
    }
  }

  @Test("test in remote monitor session")
  private async testRemote() {
    const cli1 = this.topo.dut1.cli;

    const cli2 = this.topo.dut2.cli;

    // device 1
    let vids_cli1 = await this.getVlan(cli1, [100, 200]);

    let src_dstPort_trunk = await this.changeToTrunk(
      cli1,
      this.topo.dut1.port[2]
    );

    await this.addTrunkToVlan(cli1, src_dstPort_trunk, vids_cli1[1]);

    let src_srcPort_access = await this.addAccessToVlan(
      cli1,
      this.topo.dut1.port[0],
      vids_cli1[0]
    );

    let session_cli1 = await this.addRemoteMonitorSession_src(
      cli1,
      1,
      src_srcPort_access,
      vids_cli1[1],
      src_dstPort_trunk
    );

    // device 2
    let vids_cli2 = await this.getVlan(cli2, [200, 300]);

    let remote_vlan = await this.addVlanInterface(cli2, vids_cli2[0]);

    let dst_srcPort_trunk = await this.changeToTrunk(
      cli2,
      this.topo.dut2.port[2]
    );

    await this.addTrunkToVlan(cli2, dst_srcPort_trunk, remote_vlan);

    let dst_dstPort_access = await this.addAccessToVlan(
      cli2,
      this.topo.dut2.port[0],
      remote_vlan
    );

    let session_cli2 = await this.addRemoteMonitorSession_dst(
      cli2,
      1,
      remote_vlan,
      dst_dstPort_access
    );

    // 添加　mac escape
    let mac_src_single = await this.getPortMac(src_srcPort_access);

    await this.addMacEscape(mac_src_single);

    let output = await this.outputMacEscape();

    let macReg = output.match(
      /[a-fA-F\d]{2}:[a-fA-F\d]{2}:[a-fA-F\d]{2}:[a-fA-F\d]{2}:[a-fA-F\d]{2}:[a-fA-F\d]{2}/g
    )[0];

    const testStrom = this.topo.testStrom;

    //　组包
    let packet = new Packet([
      new Ether({ src: "00:00:00:00:00:01", dst: macReg }),
      new IP()
    ]);

    await this.clearCounters(cli1);
    await this.clearCounters(cli2);

    // 抓包
    await testStrom.backend.startCapture(testStrom.port[2]);

    await testStrom.backend.send(packet, testStrom.port[0]);
    //
    let hasError = false;

    try {
      await testStrom.backend.takeCaptureData(testStrom.port[2], 1);
    } catch (e) {
      hasError = true;
    } finally {
      await testStrom.backend.stopCapture(testStrom.port[2]);

      await this.removeSession(cli1, session_cli1);
      await this.removeVlan(cli1, vids_cli1);
      await this.changeToAccess(cli1, src_dstPort_trunk);

      await this.removeSession(cli2, session_cli2);
      await this.removeVlan(cli2, vids_cli2);
      await this.changeToAccess(cli2, dst_srcPort_trunk);
      await this.removeMacEscape();
    }

    expect(hasError).toBeTruthy();
  }

  //
  private async getPortMac(portName: string): Promise<string> {
    let output = await this.topo.dut1.cli.exec`
      > show interface ${portName}
    `;

    let matcher = output.match(/[a-fA-F\d]{4}\.[a-fA-F\d]{4}\.[a-fA-F\d]{4}/g);

    return matcher[0];
  }

  private async addMacEscape(mac: string) {
    await this.topo.dut1.cli.exec`
      > configure terminal
    `;

    await this.topo.dut1.cli.exec`
      > monitor mac escape ${mac} ffff.ffff.ffff
    `;

    await this.topo.dut1.cli.exec`> end`;
  }

  private async removeMacEscape() {
    await this.topo.dut1.cli.safeExec`
      > configure terminal
      > no monitor mac escape
      > end
    `;
  }

  private async outputMacEscape(): Promise<string> {
    return await this.topo.dut1.cli.exec`
      > show monitor mac escape
    `;
  }
  //
  private async getVlan(cli: Dut, vids: Array<number>): Promise<Array<number>> {
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
  private async removeVlan(cli: Dut, vids: Array<number>) {
    await cli.exec`
      > configure terminal
      > vlan database
    `;

    for (let i = 0; i < vids.length; i++) {
      await cli.exec`> no vlan ${vids[i]}`;
    }

    await cli.exec`> end`;
  }

  private async changeToTrunk(cli: Dut, portName: string): Promise<string> {
    await cli.exec`
      > configure terminal
      > interface ${portName}
      > switchport mode trunk
      > end
    `;
    return portName;
  }

  private async changeToAccess(cli: Dut, portName: string): Promise<string> {
    await cli.exec`
      > configure terminal
      > interface ${portName}
      > switchport mode access
      > end
    `;
    return portName;
  }

  private async addTrunkToVlan(cli: Dut, portName: string, vlanId: number) {
    await cli.exec`
      > configure terminal
      > interface ${portName}
      > switchport trunk allowed vlan add ${vlanId}
      > end
    `;
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

  private async addRemoteMonitorSession_src(
    cli: Dut,
    sessionId: number,
    srcPort: string,
    remoteVlan: number,
    dstPort: string
  ): Promise<number> {
    await cli.exec`
      > configure terminal
      > monitor session ${sessionId} source interface ${srcPort}
      > monitor session ${sessionId} destination remote vlan ${remoteVlan} interface ${dstPort}
      > end
    `;
    return sessionId;
  }

  private async addRemoteMonitorSession_dst(
    cli: Dut,
    sessionId: number,
    remoteVlan: number,
    dstPort: string
  ): Promise<number> {
    await cli.exec`
      > configure terminal
      > monitor session ${sessionId} source vlan ${remoteVlan} rx
      > monitor session ${sessionId} destination interface ${dstPort}
      > end
    `;
    return sessionId;
  }

  private async removeSession(cli: Dut, sessionId: number) {
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
