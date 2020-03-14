type TimingBlock = () => TimingInfo;

export type TimingInfo = {
  name?: string;
  milliseconds: number;
  seconds: number;
  minutes: number;
  format: () => {
    value: number;
    unit_short: string;
    unit: string;
  };
};

function createFormatter(
  minutes: number,
  seconds: number,
  milliseconds: number
): () => { value: number; unit_short: string; unit: string } {
  return () => {
    if (minutes > 1) {
      return {
        unit: "minutes",
        unit_short: "m",
        value: minutes
      };
    } else if (seconds > 1) {
      return {
        unit: "seconds",
        unit_short: "s",
        value: seconds
      };
    }
    return {
      unit: "milliseconds",
      unit_short: "ms",
      value: milliseconds
    };
  };
}

export function time(name?: string): TimingBlock {
  const start = process.hrtime();

  return () => {
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
