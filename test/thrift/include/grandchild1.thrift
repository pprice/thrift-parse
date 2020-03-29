include "child1.thrift"
include "root.thrift"
include "common.thrift" // NOTE: Unused

enum GrandChild1Enum {
  XX = child1.Child1Enum.Y,
  YY,
  ZZ = root.RootEnum.A
}

struct GrandChild1Type {
  1: i32 number,
  2: string message,
  3: GrandChild1Enum enumX,
}

service ChildService1 extends root.RootService {
  root.RootType grandchild1Method(1:GrandChild1Type arg)
}
