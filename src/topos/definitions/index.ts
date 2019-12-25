import { RpcClient } from "@xtp/grpc";
import { Backend } from "@xtp/packet-craft";
import { Dut } from "@xtp/telnet";

export interface PortMap {
  [portIndex: number]: string;
  count: number;
  regexp: RegExp;
}

export interface IDut {
  cli: Dut;
  port: PortMap;
  rpc: RpcClient;
}

export interface TestStrom {
  port: PortMap;
  backend: Backend;
}
