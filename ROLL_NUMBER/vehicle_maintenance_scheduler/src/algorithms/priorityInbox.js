const PRIORITY_MAP = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

const DEFAULT_PRIORITY = 0;

const getTypePriority = (type) => {
  if (!type || typeof type !== 'string') return DEFAULT_PRIORITY;
  return PRIORITY_MAP[type] ?? DEFAULT_PRIORITY;
};

const parseTimestamp = (timestamp) => {
  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

/**
 * Compare for min-heap: lower value = worse notification (candidate for eviction).
 * Placement > Result > Event; newer timestamp wins within same type.
 */
const compareWorstFirst = (a, b) => {
  const priorityDiff = getTypePriority(a.Type) - getTypePriority(b.Type);
  if (priorityDiff !== 0) return priorityDiff;

  return parseTimestamp(a.Timestamp) - parseTimestamp(b.Timestamp);
};

/**
 * Sort output: highest priority first, newest first within type.
 */
const compareBestFirst = (a, b) => -compareWorstFirst(a, b);

class MinHeap {
  constructor(compareFn) {
    this.heap = [];
    this.compare = compareFn;
  }

  size() {
    return this.heap.length;
  }

  peek() {
    return this.heap[0];
  }

  push(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._bubbleDown(0);
    }
    return top;
  }

  toArray() {
    return [...this.heap];
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(this.heap[index], this.heap[parent]) >= 0) break;
      [this.heap[index], this.heap[parent]] = [this.heap[parent], this.heap[index]];
      index = parent;
    }
  }

  _bubbleDown(index) {
    const length = this.heap.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (left < length && this.compare(this.heap[left], this.heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < length && this.compare(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }
      if (smallest === index) break;

      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }
}

const isUnread = (notification) => {
  if (notification.isRead === undefined && notification.IsRead === undefined) {
    return true;
  }
  const readFlag = notification.isRead ?? notification.IsRead;
  return readFlag === false || readFlag === 0 || readFlag === 'false';
};

const isBetterThan = (candidate, currentWorst) => {
  return compareWorstFirst(candidate, currentWorst) > 0;
};

/**
 * Maintain top-k highest priority unread notifications.
 * Time: O(n log k), Space: O(k)
 */
const buildPriorityInbox = (notifications, k = 10) => {
  const heap = new MinHeap(compareWorstFirst);
  let processedCount = 0;
  let evictedCount = 0;

  for (const notification of notifications) {
    if (!isUnread(notification)) continue;

    processedCount += 1;
    const normalized = {
      ID: notification.ID || notification.id,
      Type: notification.Type || notification.type,
      Message: notification.Message || notification.message,
      Timestamp: notification.Timestamp || notification.timestamp,
    };

    if (heap.size() < k) {
      heap.push(normalized);
      continue;
    }

    const worst = heap.peek();
    if (isBetterThan(normalized, worst)) {
      heap.pop();
      heap.push(normalized);
      evictedCount += 1;
    }
  }

  return {
    inbox: heap.toArray().sort(compareBestFirst),
    stats: { processedCount, evictedCount, heapSize: heap.size() },
  };
};

module.exports = {
  PRIORITY_MAP,
  getTypePriority,
  compareWorstFirst,
  compareBestFirst,
  buildPriorityInbox,
  MinHeap,
};
