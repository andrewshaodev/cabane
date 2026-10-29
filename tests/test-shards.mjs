// Keep software WebGL serial, while Node/DOM work uses the other shared workers.
// A unit-only selection still uses every worker. File order breaks cost ties.
export function assignTestShards(files, shardCount) {
  const shards = Array.from({ length: shardCount }, () => ({ cost: 0, files: [] }));
  const hasBrowser = files.some((file) => file.browser);
  for (const file of [...files].sort(
    (left, right) => right.cost - left.cost || left.name.localeCompare(right.name),
  )) {
    const candidates =
      hasBrowser && shardCount > 1 ? (file.browser ? shards.slice(0, 1) : shards.slice(1)) : shards;
    const shard = candidates.reduce((lightest, candidate) =>
      candidate.cost < lightest.cost ? candidate : lightest,
    );
    shard.files.push(file.name);
    shard.cost += file.cost;
  }
  return shards.map((shard) => shard.files.sort());
}
