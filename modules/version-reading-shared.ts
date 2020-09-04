function readTextFrom(node: string[]): string | undefined {
  return node
    ? node[0]
    : undefined;
}

export function tryReadVersionFrom(
  groups: any[],
  nodeName: string
): string | undefined {
  return groups.reduce(
    (acc: string | undefined, cur: any) =>
      acc || readTextFrom(cur[nodeName]),
    undefined
  );
}
