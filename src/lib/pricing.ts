import type { Grade } from "@/data/catalog";

export type FunctionStatus = "ok" | "issues" | "dead";

export function resolveGrade(input: {
  functionStatus?: FunctionStatus;
  issueIds?: string[];
  screen?: string;
  body?: string;
  battery?: string;
  strap?: string;
}): Grade {
  const scores: number[] = [];

  if (input.functionStatus === "dead") return 5;
  if (input.functionStatus === "ok") scores.push(1);
  if (input.functionStatus === "issues") {
    const n = input.issueIds?.length ?? 0;
    scores.push(n >= 3 ? 4 : n === 2 ? 3 : 2);
  }

  if (input.screen === "excellent") scores.push(1);
  if (input.screen === "light") scores.push(2);
  if (input.screen === "broken") scores.push(4);

  if (input.body === "excellent") scores.push(1);
  if (input.body === "light") scores.push(2);
  if (input.body === "heavy") scores.push(4);

  if (input.battery === "fair") scores.push(2);
  if (input.battery === "poor") scores.push(4);
  if (input.strap === "fair") scores.push(2);
  if (input.strap === "poor") scores.push(3);

  const worst = Math.max(1, ...scores);
  return Math.min(5, worst) as Grade;
}

export function vnd(n: number) {
  return `${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} đ`;
}

export function vndComma(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
