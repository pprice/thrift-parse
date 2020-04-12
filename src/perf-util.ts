type TimingBlock = () => TimingInfo;

type TimingInfoFormat = {
  value: number;
  unitShort: string;
  unit: string;
};

export type TimingInfo = {
  milliseconds: number;
  seconds: number;
  minutes: number;
  format: () => TimingInfoFormat;
  subtract(info: TimingInfo): TimingInfo;
  add(info: TimingInfo): TimingInfo;
};

function createFormatter(minutes: number, seconds: number, milliseconds: number): () => { value: number; unitShort: string; unit: string } {
  return (): TimingInfoFormat => {
    if (minutes > 1) {
      return {
        unit: "minutes",
        unitShort: "m",
        value: minutes
      };
    } else if (seconds > 1) {
      return {
        unit: "seconds",
        unitShort: "s",
        value: seconds
      };
    }
    return {
      unit: "milliseconds",
      unitShort: "ms",
      value: milliseconds
    };
  };
}

export function fromMilliseconds(milliseconds: number): TimingInfo {
  const seconds = milliseconds / 1000.0;
  const minutes = seconds / 60.0;
  return {
    milliseconds,
    seconds,
    minutes,
    format: createFormatter(minutes, seconds, milliseconds),
    add: (other: TimingInfo): TimingInfo => fromMilliseconds(milliseconds + other.milliseconds),
    subtract: (other: TimingInfo): TimingInfo => fromMilliseconds(milliseconds - other.milliseconds)
  };
}

export function time(basis?: TimingInfo): TimingBlock {
  const start = process.hrtime();

  return (): TimingInfo => {
    const time = process.hrtime(start);

    const nanoseconds = time[0] * 1e9 + time[1];
    const milliseconds = nanoseconds / 1e6 + (basis?.milliseconds || 0);
    return fromMilliseconds(milliseconds);
  };
}

export function none(): TimingInfo {
  return fromMilliseconds(0);
}

export function sumTime(...times: TimingInfo[]): TimingInfo {
  const totalMs = times.reduce((acc, i) => acc + i.milliseconds, 0.0);
  return fromMilliseconds(totalMs);
}
