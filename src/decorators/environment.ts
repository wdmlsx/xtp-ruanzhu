import { ClassType } from "./types";
import { Suite } from "./suite";

export class Environment {
  private readonly suiteMap: Map<string, Suite> = new Map();

  public generate(target: ClassType, message: string) {
    this.requireSuite(target)
      .message(message)
      .generate();
  }

  public addTest(
    cls: ClassType,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>,
    message: string,
    timeout: number
  ) {
    this.requireSuite(cls).addTest(propertyKey, descriptor, message, timeout);
  }

  public addTestOnly(
    cls: ClassType,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>,
    message: string,
    timeout: number
  ) {
    this.requireSuite(cls).addTestOnly(
      propertyKey,
      descriptor,
      message,
      timeout
    );
  }

  public addBeforeEach(
    cls: ClassType,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    this.requireSuite(cls).addBeforeEach(propertyKey, descriptor);
  }

  public addAfterEach(
    cls: ClassType,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    this.requireSuite(cls).addAfterEach(propertyKey, descriptor);
  }

  public addBeforeAll(
    cls: ClassType,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    this.requireSuite(cls).addBeforeAll(propertyKey, descriptor);
  }

  public addAfterAll(
    cls: ClassType,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    this.requireSuite(cls).addAfterAll(propertyKey, descriptor);
  }

  public injectTopo(cls: ClassType, propertyKey: string, type: any) {
    this.requireSuite(cls).injectTopo(propertyKey, type);
  }

  private requireSuite(cls: ClassType) {
    let suite = this.suiteMap.get(cls.name);
    if (!suite) {
      suite = new Suite(cls);
      this.suiteMap.set(cls.name, suite);
    }

    return suite;
  }
}
