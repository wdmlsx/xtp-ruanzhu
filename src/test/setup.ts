import topoManager from "@xtp/topo-manager";
import * as topo from "../topos";

topoManager.register(topo.SingleDevice);
topoManager.register(topo.DoubleDevice);
topoManager.register(topo.QuadrupleDevice);
topoManager.register(topo.ControllerDevice);

jest.setTimeout(60000);
