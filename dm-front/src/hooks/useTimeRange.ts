import { useContext } from "react";
import { TimeRangeContext } from "../context/TimeRangeContext";

export function useTimeRange() {
  return useContext(TimeRangeContext);
}