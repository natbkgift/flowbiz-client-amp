export function median(values) {
  const nums = values.filter((v) => Number.isFinite(v)).slice().sort((a, b) => a - b);
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

export function fmtMs(n) {
  return Number.isFinite(n) ? `${Math.round(n)}ms` : 'n/a';
}
