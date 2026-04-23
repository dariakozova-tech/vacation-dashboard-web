const BASE_URL = `https://${process.env.SAGE_HR_SUBDOMAIN}.sage.hr/api`;
const HEADERS = {
  'X-Auth-Token': process.env.SAGE_HR_API_TOKEN!,
  'Content-Type': 'application/json',
};

export async function sageGet(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Sage HR API error: ${res.status} ${path}`);
  return res.json();
}

export async function sageGetAll(path: string): Promise<any[]> {
  const results: any[] = [];
  let page = 1;
  while (true) {
    const sep = path.includes('?') ? '&' : '?';
    const data = await sageGet(`${path}${sep}page=${page}`);
    results.push(...(data.data ?? []));
    if (!data.meta?.next_page) break;
    page++;
  }
  return results;
}
