## 1.1    项目介绍

控制器实现历史告警和历史性能数据使用Influxdb，本文描述SPTN项目上进入influxdb的数据的相关定义。

 

## 1.2    数据定义

### 1.2.1     databases

xnetnetworks

### 1.2.2     measurements

measurements有两类，分别是：

alarm，notify

alarm类记录告警事件，是SPTN设备事件触发；

notify类记录性能信息，是SPTN设备定时上告；

### 1.2.3     alarm类的measurements

基于proto文件定义，对alarm定义

 

| measurements   | Tag: device                    | Tag: name                             | field          | field  | field | field | field            |
| ----------- | ------------------------------ | ------------------------------------- | -------------------- | -------------------- | -------------------- | -------------------- | -------------------- |
| alarm_intf_state  | String    如Device:10.10.10.10 | String如device:10.10.10.10:   eth-0-1 | value(Bool, UP/DOWN) |        |        |        |        |
| alarm_lsppe_oam |                                |                                       | value(Int32, INIT/OK/FAIL) |  |  |  |  |
| alarm_lsppe_lm |                                |                                       | value(Int32, 丢包率) |         |         |         |         |
| alarm_tunnel_aps |                                |                                       | value(String, LSP名字) |       |       |       |       |
| alarm_pwpe_oam | | | value(int32, INIT/OK/FAIL) |  |  |  |  |
| alarm_section_oam |                                |                                       | value(Bool,UP/DOWN) |        |        |        |        |
| alarm_link_detect | | String如device:10.10.10.10:   eth-0-1 |  | tyep(int32,1:satcom/2:fso/3:vfh/4:ethernet/5:fiber/6:lte) | status(bool,UP/DOWN) | bandwidth(uint32,kbps) | delay(uint32,ns) |

### 1.2.4     notify 类的measurements

| measurements       | Tag: device | Tag:name | field                | field                   | field                            | field                              | field              | field                  | field             |
| ------------------ | ----------- | -------- | -------------------- | ----------------------- | -------------------------------- | ---------------------------------- | ------------------ | ---------------------- | ----------------- |
| notify_lsppe       |             |          | status(UP/DOWN)      | bhh_event(INIT/OK/FAIL) | local_los_radio(uint32,n*0.0001) | remote_loss_radio(uint32,n*0.0001) | rx(uint64, bytes)  | tx(uint64, bytes)      | delay(uint32, ns) |
| notify_lspp        |             |          | east_status(UP/DOWN) | west_status(UP/DOWN)    |                                  |                                    |                    |                        |                   |
| notify_pwpe        |             |          | status(UP/DOWN)      | bhh_event(INIT/OK/FAIL) | local_los_radio(uint32)          | remote_loss_radio(uint32)          | rx(uint64)         | tx(uint64)             | delay(uint32)     |
| notify_link_detect |             |          | status(UP/DOWN)      | bandwidth(uint32, kbps) | type(int32, 1:satcom...)         | delay(int32, ns)                   | ip(uint32, ipaddr) |                        |                   |
| notify_intf        |             |          | Status(UP/DOWN)      | rx_bytes(uint64)        | rx_packets(uint64)               | tx_bytes(uint64)                   | tx_packets(uint64) | bandwidth(uint32 mbps) |                   |