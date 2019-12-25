import axios, { AxiosInstance } from "axios";

export interface AcNode {
  deviceId: string;
  portName: string;
  acType: string;
  acValue: string;
}

export interface Data {
  workLsp: string;
  lsps: Array<any>;
}

export class Controller {
  private readonly request: AxiosInstance;
  public constructor(ip, port) {
    this.request = axios.create({
      baseURL: `http://${ip}:${port}`,
      timeout: 60 * 1000
    });
  }

  public async createConnection(
    nodes: AcNode[],
    name: string,
    bandwidth: string,
    cos: string
  ): Promise<void> {
    if (nodes.length < 2) {
      throw new Error("Need more than 1 nodes");
    }

    if (nodes.length === 2) {
      // addFlexConnect
      await axios.post("http://10.10.10.32:8181/onos/sptn/vpws", {
        eastnode: nodes[0].deviceId,
        westnode: nodes[1].deviceId,
        east_interface: nodes[0].portName,
        west_interface: nodes[1].portName,
        east_ac_type: nodes[0].acType,
        east_ac_value: nodes[0].acValue,
        west_ac_type: nodes[1].acType,
        west_ac_value: nodes[1].acValue,
        business_name: name,
        bandwidth: bandwidth,
        cos: cos
      });
    } else {
      // addFlexP2mpConnect
    }
  }

  public async getConnection(nodeNum: number): Promise<Data> {
    if (nodeNum < 2) {
      throw new Error("Need more than 1 nodes");
    }

    if (nodeNum === 2) {
      // getFlexConnect
      const resp = await axios.get("http://10.10.10.32:8181/onos/sptn/vpws");
      let workLsp;
      let lsps;
      try {
        workLsp = resp.data.data[0].selected_lsp;
      } catch (e) {
        workLsp = ``;
      }
      try {
        lsps = resp.data.data[0].lsps;
      } catch (e) {
        lsps = null;
      }
      let data: Data = { workLsp, lsps };
      return data;
    } else {
      // getFlexP2mpConnect
    }
  }

  public async clearConnection(nodeNum: number): Promise<void> {
    if (nodeNum < 2) {
      throw new Error("Need more than 1 nodes");
    }

    if (nodeNum === 2) {
      // deleteFlexConnect
      const resp = await axios.get("http://10.10.10.32:8181/onos/sptn/vpws");
      let data = resp.data;
      await axios.delete("http://10.10.10.32:8181/onos/sptn/vpws", { data });
    } else {
      // deleteFlexP2mpConnect
    }
  }

  public async addFilterClassSet(name: string): Promise<void> {
    const resp = await axios.post(
      "http://10.10.10.32:8181/onos/sptn/filter_class_set",
      {
        filter_class_set_name: name
      }
    );
  }

  public async deleteFilterClassSet(setId: string): Promise<void> {
    var data = {
      data: [
        {
          filter_class_set_id: setId
        }
      ]
    };
    await axios.delete("http://10.10.10.32:8181/onos/sptn/filter_class_set", {
      data
    });
  }

  public async getFilterClassSetIds(): Promise<Array<any>> {
    const resp = await axios.get(
      "http://10.10.10.32:8181/onos/sptn/filter_class_set"
    );
    let ids: Array<any> = new Array();
    var data = {
      data: resp.data.filterclass_setlist
    };
    for (let value of data.data) {
      ids.push(value.filter_class_set_id);
    }
    return ids;
  }

  public async getFilterClassSetName(setId: string): Promise<any> {
    const resp = await axios.get(
      "http://10.10.10.32:8181/onos/sptn/filter_class_set"
    );
    var data = {
      data: resp.data.filterclass_setlist
    };
    for (let value of data.data) {
      if (value.filter_class_set_id === setId) {
        return value.filter_class_set_name;
      }
    }
    return null;
  }

  public async addFilterClassEntry(
    id: string,
    vlan: string,
    srcMac: string,
    dstMac: string,
    srcIp: string,
    dstIp: string,
    ProtoclSrcPort: string,
    ProtoclDstPort: string,
    protocol: string,
    etherType: string,
    cos: string,
    dscp: string
  ): Promise<void> {
    const resp = await axios.post(
      "http://10.10.10.32:8181/onos/sptn/filterclass",
      {
        filter_class_set_id: id,
        vlan: vlan,
        src_mac: srcMac,
        dst_mac: dstMac,
        src_ip: srcIp,
        dst_ip: dstIp,
        protocol_src_port: ProtoclSrcPort,
        protocol_dst_port: ProtoclDstPort,
        protocol: protocol,
        ether_type: etherType,
        cos: cos,
        dscp: dscp
      }
    );
  }

  public async deleteFilterClassEntry(
    setId: string,
    entryId: string
  ): Promise<void> {
    let data = {
      data: [
        {
          filter_class_set_id: setId,
          filter_class_id: entryId
        }
      ]
    };

    const resp = await axios.delete(
      "http://10.10.10.32:8181/onos/sptn/filterclass",
      {
        data
      }
    );
  }

  public async getFilterClassEntryIds(setId: string): Promise<any> {
    let ids: Array<any> = new Array();
    const resp = await axios.get(
      "http://10.10.10.32:8181/onos/sptn/filter_class_set"
    );
    var data = {
      data: resp.data.filterclass_setlist
    };
    for (let value of data.data) {
      if (value.filter_class_set_id === setId) {
        for (let object of value.filterclasslist) {
          ids.push(object.filter_class_id);
        }
        return ids;
      }
    }
    return null;
  }

  public async getTopology(): Promise<Array<any>> {
    const resp1 = await axios.get(
      "http://10.10.10.32:8181/onos/v1/topology/clusters/1/links"
    );
    let link1 = resp1.data.links;
    const resp2 = await axios.get(
      "http://10.10.10.32:8181/onos/v1/topology/clusters/2/links"
    );
    let link2 = resp2.data.links;
    const resp3 = await axios.get(
      "http://10.10.10.32:8181/onos/v1/topology/clusters/3/links"
    );
    let link3 = resp3.data.links;
    let links = link1.concat(link2).concat(link3);
    return links;
  }
}
