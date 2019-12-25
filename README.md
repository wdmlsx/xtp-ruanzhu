# XTP TEST

xtp 测试用例集合

## 安装

```bash
$ yarn
```

## 测试

### 回归测试

```bash
$ yarn run test
```

### 单文件测试

```bash
./node_modules/.bin/jest FILE
```

## 开发流程

### 创建对应的测试用例集文件夹

例如 vlan oam，路径为 `src/test/device/l2/vlan/oam`

### 编写测试用例

1. 根据 spec，在对应的文件夹中创建测试用例，测试用例文件应以 spec 序号开头，后缀名为 test.ts，例如

   `R-VLAN-1-0010_create_vlan.test.ts`

2. 从 `src/topos` 中确认当前测试用例所需 topo，编写测试用例，例如

   ```javascript
   @Describe("Current test suit description")
   class TestXXX {
   	@InjectTopo
   	private readonly topo: SingleDevice;
   	
   	@Test("Current test point description")
   	private testXXX() {
   		// test
   	}
   }
   ```

### 运行测试

- 运行单文件

  `./node_modules/.bin/jest FILE`

- 运行文件夹下所有测试

  `./node_modules/.bin/jest --runInBand DIR`

- 运行所有测试

  `yarn run test`

## 规范

- 每个测试用例需要清除自己下发的配置，即使运行出错
- 一个 spec 对应一个测试脚本，并且放到对应目录
- 若当前 spec 测试项已包含在其他测试脚本当中，创建空的 test，注明 refer to `FILE`
- 测试脚本中不得出现和测试环境有关的数据，例如设备的端口名，打流仪的端口等，应当从 topo 中获取别名
- 提交前会有强制 lint，需要修改为正确的风格后才能提交，手动执行 lint 可以用 `yarn run lint`
- 使用设备端口时，尽量从低序号开始使用

## API

### Decorators

测试用例所用装饰器

```javascript
@Describe(message: string, timeout?: number); // 描述测试用例

@Test(message: string, timeout?: number); // 描述测试点

@TestOnly(message: string, timeout?: number); // 仅运行当前测试点，调试时使用

@BeforeAll; // 测试用例执行前运行

@AfterAll; // 测试用例执行后运行

@BeforeEach; // 每个测试点执行前运行

@AfterEach; // 每个测试点执行后运行
```

### Telnet.Dut

telnet 设备工具

```javascript
async connect(); // 连接设备

async end(); // 断开设备连接

async exec`TEMPLATE STRING`; // 运行 cli 指令，可以运行多条，每条占一行，以 '> ' 开头

async safeExec`TEMPLATE STRING`; // 同 exec，但出错不会丢异常，适用于清除配置
```

### PacketCraft

发包工具

#### Packet

组包 API

```javascript
constructor(layers: Layer[]); // 组包，根据包结构传入对应数组
```

例如，创建一个 TCP 包

```javascript
const tcpPacket = new Packet([
  new Ether(),
  new IP(),
  new TCP()
]);
```

#### Backend

打流仪 API

```javascript
async send(packet: Packet, port: string); // 发送一个包

async clearPortStatistics(); // 清除端口统计

async getPortStatistics(port: string): Promise<PortStatistics>; // 获取对应端口统计

async startCapture(port: string); // 开始抓包

async stopCapture(port: string); // 停止抓包

async getCaptureData(port: string): Promise<CaptureEntry[]>; // 获取抓包数据

async takeCaptureData(port: string, count: number, timeout?: number): Promise<CaptureEntry[]>; // 同 getCaptureData，但能提供需要抓包的数量，没抓到对应数量的包时，函数会 block 住
```

> 注：组包模式类似于 scapy，所有 layer 和 layer 对应的字段和 scapy 相同，组包前可先用 scapy 测试，参考：https://scapy.net/
