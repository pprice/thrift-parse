struct RootType {
  1: i32 number,
  2: string message,
}

enum RootEnum {
  A,
  B,
  C,
  D,
  E,
  F,
}

service RootService {
  RootType rootMethod(1:string arg)
}
