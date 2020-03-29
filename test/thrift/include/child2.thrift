include "root.thrift"
include "common.thrift"

enum Child2Enum {
  X = root.RootEnum.A,
  Y,
  Z
}

struct Child2Type {
  1: i32 number,
  2: string message,
  3: Child2Enum enumX
}

const i32 V = common.AAA;

service ChildService2 extends root.RootService {
  root.RootType child2Method(1:Child1Type arg)
}
