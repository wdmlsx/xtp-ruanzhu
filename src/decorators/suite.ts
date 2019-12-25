import topoManager from "@xtp/topo-manager";
import { ClassType } from "./types";

interface TestEntry {
  propertyKey: string;
  descriptor: TypedPropertyDescriptor<any>;
  message: string;
  timeout: number;
}

interface topoEntry {
  propertyKey: string;
  topoType: any;
}

export class Suite {
  private _message: string;
  private testMap: Map<string, TestEntry> = new Map();
  private testOnlyMap: Map<string, TestEntry> = new Map();
  private beforeEachMap: Map<string, TypedPropertyDescriptor<any>> = new Map();
  private afterEachMap: Map<string, TypedPropertyDescriptor<any>> = new Map();
  private beforeAllMap: Map<string, TypedPropertyDescriptor<any>> = new Map();
  private afterAllMap: Map<string, TypedPropertyDescriptor<any>> = new Map();
  private topo: topoEntry;

  constructor(private readonly cls: ClassType) {}

  public message(message: string) {
    this._message = message;

    return this;
  }

  public addTest(
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>,
    message: string,
    timeout: number
  ) {
    this.testMap.set(propertyKey, {
      propertyKey,
      descriptor,
      message,
      timeout
    });
  }

  public addTestOnly(
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>,
    message: string,
    timeout: number
  ) {
    this.testOnlyMap.set(propertyKey, {
      propertyKey,
      descriptor,
      message,
      timeout
    });
  }

  public addBeforeEach(
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    this.beforeEachMap.set(propertyKey, descriptor);
  }

  public addAfterEach(
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    this.afterEachMap.set(propertyKey, descriptor);
  }

  public addBeforeAll(
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    this.beforeAllMap.set(propertyKey, descriptor);
  }

  public addAfterAll(
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    this.afterAllMap.set(propertyKey, descriptor);
  }

  public injectTopo(propertyKey: string, topoType: any) {
    this.topo = {
      propertyKey,
      topoType
    };
  }

  public generate() {
    const instance = new this.cls();

    describe(this._message, () => {
      // relect
      beforeAll(async () => {
        if (this.topo) {
          instance[this.topo.propertyKey] = await topoManager.require(
            this.topo.topoType
          );
        }
      }, 60000);

      // terminate
      afterAll(async () => {
        await topoManager.terminate();
      }, 60000);

      // beforeAll
      for (let name of this.beforeAllMap.keys()) {
        beforeAll(() => instance[name]());
      }

      // afterAll
      for (let name of this.afterAllMap.keys()) {
        afterAll(() => instance[name]());
      }

      // beforeEach
      for (let name of this.beforeEachMap.keys()) {
        beforeEach(() => instance[name]());
      }

      // afterEach
      for (let name of this.afterEachMap.keys()) {
        afterEach(() => instance[name]());
      }

      // test
      for (let [name, entry] of this.testMap.entries()) {
        test(entry.message, () => instance[name](), entry.timeout);
      }

      // test only
      for (let [name, entry] of this.testOnlyMap.entries()) {
        test.only(entry.message, () => instance[name](), entry.timeout);
      }
    });
  }
}
