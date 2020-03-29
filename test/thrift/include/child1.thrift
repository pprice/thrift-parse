include "root.thrift"

enum Child1Enum {
  X = root.RootEnum.A,
  Y,
  Z
}

struct Child1Type {
  1: i32 number,
  2: string message,
  3: Child1Enum enumX,
}

service ChildService1 extends root.RootService {
  root.RootType child1Method(1:Child1Type arg)
}
