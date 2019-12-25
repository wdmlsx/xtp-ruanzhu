export async function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

// 将ip地址转换成十进制数字
export async function ipToNumber(ip: string): Promise<number> {
  let num = 0;
  if (ip === "") {
    return num;
  }
  const aNum = ip.split(".");
  if (aNum.length !== 4) {
    return num;
  }
  num += parseInt(aNum[0]) << 24;
  num += parseInt(aNum[1]) << 16;
  num += parseInt(aNum[2]) << 8;
  num += parseInt(aNum[3]) << 0;
  num = num >>> 0;
  return num;
}

// 将十进制数字转换成ip地址
export async function numberToIp(ipNumber: number): Promise<string> {
  let ip = "";
  if (ipNumber <= 0) {
    return ip;
  }
  const ip3 = (ipNumber << 0) >>> 24;
  const ip2 = (ipNumber << 8) >>> 24;
  const ip1 = (ipNumber << 16) >>> 24;
  const ip0 = (ipNumber << 24) >>> 24;

  ip += ip3 + "." + ip2 + "." + ip1 + "." + ip0;

  return ip;
}
