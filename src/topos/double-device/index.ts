/**
 * +---------------------+        +---------------------+
 * |               port2 +--------+ port2               |
 * |       DUT1    port3 +--------+ port3   DUT2        |
 * | port0         port1 |        | port0         port1 |
 * +---+-------------+---+        +---------------------+
 *     |             |                |             |
 * +---+-------------+----------------+-------------+---+
 * |  port0        port1            port2         port3 |
 * |                     test strom                     |
 * +----------------------------------------------------+
 */
import { RpcClient } from "@xtp/grpc";
import { RenixBackend } from "@xtp/packet-craft";
import { Dut } from "@xtp/telnet";
import { Topo } from "@xtp/topo-manager";
import { XpathManager } from "@xtp/xpath-manager";
import { resolve } from "path";
import { IDut, TestStrom } from "../definitions";

interface IDoubleDevice {
  readonly dut1: IDut;
  readonly dut2: IDut;
  readonly testStrom: TestStrom;
}

export class DoubleDevice implements Topo, IDoubleDevice {
  private readonly _dut1 = {
    rpc: new RpcClient(
      "10.10.10.49:50051",
      resolve(__dirname, "../proto/service.proto")
    ),
    cli: new Dut({
      ip: "10.10.10.49",
      timeout: 60000,
      prompt: /5160-49.*?#\s+/,
      debug: false
    }),
    port: {
      0: "eth-0-5",
      1: "eth-0-6",
      2: "eth-0-3",
      3: "eth-0-4",
      4: "eth-0-1",
      5: "eth-0-2",
      6: "eth-0-7",
      7: "eth-0-8",
      8: "eth-0-9",
      9: "eth-0-10",
      10: "eth-0-11",
      11: "eth-0-12",
      12: "eth-0-13",
      13: "eth-0-14",
      14: "eth-0-15",
      15: "eth-0-16",
      16: "eth-0-17",
      17: "eth-0-18",
      18: "eth-0-19",
      19: "eth-0-20",
      count: 20,
      regexp: /eth-\d+-\d+/
    }
  };
  private readonly _dut2 = {
    rpc: new RpcClient(
      "10.10.10.50:50051",
      resolve(__dirname, "../proto/service.proto")
    ),
    cli: new Dut({
      ip: "10.10.10.50",
      timeout: 60000,
      prompt: /5160-50.*?#\s+/,
      debug: false
    }),
    port: {
      0: "eth-0-5",
      1: "eth-0-6",
      2: "eth-0-3",
      3: "eth-0-4",
      4: "eth-0-1",
      5: "eth-0-2",
      6: "eth-0-7",
      7: "eth-0-8",
      8: "eth-0-9",
      9: "eth-0-10",
      10: "eth-0-11",
      11: "eth-0-12",
      12: "eth-0-13",
      13: "eth-0-14",
      14: "eth-0-15",
      15: "eth-0-16",
      16: "eth-0-17",
      17: "eth-0-18",
      18: "eth-0-19",
      19: "eth-0-20",
      count: 20,
      regexp: /eth-\d+-\d+/
    }
  };
  private readonly _testStrom = {
    backend: new RenixBackend("10.10.10.15", 4000),
    port: {
      0: "//10.10.10.16/2/1",
      1: "//10.10.10.16/2/2",
      2: "//10.10.10.16/2/3",
      3: "//10.10.10.16/2/4",
      count: 4,
      regexp: /\/\/(\d+\.){3}\d+\.\/\d+\/\d+/
    }
  };
  private readonly xpathManager = new XpathManager({
    ip: "10.10.10.18",
    activateDelay: 10000
  });

  public async activate() {
    for (let index = 0; index < this.testStrom.port.count; index++) {
      await this.testStrom.backend.addPort(this.testStrom.port[index]);
    }

    // await this.xpathManager.activateTopo("topo-51-and-52");
  }

  public async deactivate() {
    // await this.xpathManager.deactiveTopo("topo-51-and-52");
  }

  public get dut1(): IDut {
    return this._dut1;
  }

  public get dut2(): IDut {
    return this._dut2;
  }

  public get testStrom(): TestStrom {
    return this._testStrom;
  }
}
