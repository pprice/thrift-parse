type TimingBlock = () => TimingInfo;

type TimingInfoFormat = {
  value: number;
  unitShort: string;
  unit: string;
};

export type TimingInfo = {
  name?: string;
  milliseconds: number;
  seconds: number;
  minutes: number;
  format: () => TimingInfoFormat;
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

export function time(name?: string): TimingBlock {
  const start = process.hrtime();

  return (): TimingInfo => {
    const time = process.hrtime(start);

    const nanoseconds = time[0] * 1e9 + time[1];
    const milliseconds = nanoseconds / 1e6;
    const seconds = nanoseconds / 1e9;
    const minutes = seconds / 60.0;

    return {
      name,
      milliseconds,
      seconds,
      minutes,
      format: createFormatter(minutes, seconds, milliseconds)
    };
  };
}
