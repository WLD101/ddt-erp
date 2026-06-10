function ipToLong(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

export function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const [range, bits = "32"] = cidr.split("/");
    const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1);
    return (ipToLong(ip) & mask) === (ipToLong(range) & mask);
  } catch {
    return false;
  }
}

export function isIpAllowed(ip: string | null | undefined, allowedCidrs: string[]): boolean {
  if (!ip) return false;
  // If allowedCidrs is empty, default deny.
  if (allowedCidrs.length === 0) return false;
  return allowedCidrs.some((cidr) => isIpInCidr(ip, cidr));
}
