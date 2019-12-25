/**
 * +-------------------+        +-------------+
 * |             port0 +--------+ port0       |
 * | test strom  port1 +--------+ port1   DUT |
 * +-------------------+        +-------------+
 */

import { RpcClient } from "@xtp/grpc";
import { RenixBackend } from "@xtp/packet-craft";
import { Dut } from "@xtp/telnet";
import { Topo } from "@xtp/topo-manager";
import { XpathManager } from "@xtp/xpath-manager";
import { resolve } from "path";
import { Controller } from "../controller";
import { PortMap, TestStrom } from "../definitions";

interface ISingleDevice {
  readonly dut: Dut;
  readonly port: PortMap;
  readonly testStrom: TestStrom;
  readonly controller: Controller;
  readonly rpc: RpcClient;
}

export class SingleDevice implements Topo, ISingleDevice {
  private readonly _rpc = new RpcClient(
    "10.10.10.48:50051",
    resolve(__dirname, "../proto/service.proto")
  );
  private readonly _dut = new Dut({
    ip: "10.10.10.48",
    timeout: 60000,
    prompt: /Switch?#\s+/,
    // prompt: /DUT1?#\s+/,
    debug: false
  });
  private readonly _testStrom = {
    backend: new RenixBackend("10.10.10.15", 4000),
    port: {
      0: "//10.10.10.16/2/3",
      1: "//10.10.10.16/2/4",
      count: 2,
      regexp: /\/\/(\d+\.){3}\d+\.\/\d+\/\d+/
    }
  };
  private readonly _controller = new Controller("10.10.10.32", 8118);
  private readonly xpathManager = new XpathManager({
    ip: "10.10.10.18",
    activateDelay: 10000
  });

  public async activate() {
    for (let index = 0; index < this.testStrom.port.count; index++) {
      await this.testStrom.backend.addPort(this.testStrom.port[index]);
    }
    // await this.xpathManager.activateTopo("topo-10.10.10.48");
  }

  public async deactivate() {
    // await this.xpathManager.deactiveTopo("topo-10.10.10.48");
    //await this.xpathManager.activateTopo("topo-10.10.10.51");
  }

  public get dut(): Dut {
    return this._dut;
  }

  public get port(): PortMap {
    return {
      0: "eth-0-1",
      1: "eth-0-2",
      2: "eth-0-3",
      3: "eth-0-4",
      4: "eth-0-5",
      5: "eth-0-6",
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
      20: "eth-0-21",
      21: "eth-0-22",
      22: "eth-0-23",
      23: "eth-0-24",
      count: 16,
      regexp: /eth-\d+-\d+/
    };
  }

  public get testStrom(): TestStrom {
    return this._testStrom;
  }

  public get controller(): Controller {
    return this._controller;
  }

  public get rpc(): RpcClient {
    return this._rpc;
  }
}
