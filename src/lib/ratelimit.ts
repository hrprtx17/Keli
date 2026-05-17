const requests = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string, limit = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const record = requests.get(ip);
  
  if (!record || now > record.resetAt) {
    requests.set(ip, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }
  
  if (record.count >= limit) {
    return false; // blocked
  }
  
  record.count++;
  return true; // allowed
}
