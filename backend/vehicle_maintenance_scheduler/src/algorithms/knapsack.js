/**
 * 0/1 Knapsack — maximize total impact within mechanic hour capacity.
 * Time: O(n * capacity), Space: O(n * capacity)
 *
 * @param {number} mechanicHours - knapsack capacity
 * @param {Array<{TaskID: string, Duration: number, Impact: number}>} tasks
 * @returns {{ selectedTasks: Array, totalDuration: number, totalImpact: number }}
 */
const solveKnapsack = (mechanicHours, tasks) => {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return { selectedTasks: [], totalDuration: 0, totalImpact: 0 };
  }

  const capacity = Math.floor(Number(mechanicHours));
  if (capacity <= 0) {
    return { selectedTasks: [], totalDuration: 0, totalImpact: 0 };
  }

  const n = tasks.length;
  const dp = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const weight = Math.floor(Number(tasks[i - 1].Duration)) || 0;
    const value = Number(tasks[i - 1].Impact) || 0;

    for (let w = 0; w <= capacity; w++) {
      dp[i][w] = dp[i - 1][w];
      if (weight <= w && weight > 0) {
        dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - weight] + value);
      }
    }
  }

  let remainingCapacity = capacity;
  const selectedTasks = [];

  for (let i = n; i >= 1; i--) {
    if (dp[i][remainingCapacity] !== dp[i - 1][remainingCapacity]) {
      const task = tasks[i - 1];
      selectedTasks.push({
        TaskID: task.TaskID,
        Duration: Number(task.Duration),
        Impact: Number(task.Impact),
      });
      remainingCapacity -= Math.floor(Number(task.Duration)) || 0;
    }
  }

  selectedTasks.reverse();

  const totalDuration = selectedTasks.reduce((sum, t) => sum + t.Duration, 0);
  const totalImpact = selectedTasks.reduce((sum, t) => sum + t.Impact, 0);

  return { selectedTasks, totalDuration, totalImpact };
};

module.exports = {
  solveKnapsack,
};
