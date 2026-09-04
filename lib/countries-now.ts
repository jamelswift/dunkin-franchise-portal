export type Country = { name: string; iso2: string; iso3?: string }
export type PopulationCity = { name: string; country: string; state?: string; population?: number }

const API_URL = 'https://countriesnow.space/api/v0.1'

async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`CountriesNow request failed (${response.status})`)
  const result = await response.json() as { error?: boolean; msg?: string; data?: T }
  if (result.error || result.data === undefined) throw new Error(result.msg || 'CountriesNow returned no data')
  return result.data
}

export async function getCountries(): Promise<Country[]> {
  const data = await request<Array<{ country?: string; name?: string; iso2?: string; iso3?: string }>>('/countries')
  return data
    .map(country => ({
      name: country.name || country.country || '',
      iso2: country.iso2 || '',
      iso3: country.iso3,
    }))
    .filter(country => country.name && country.iso2)
}

export async function getStates(country: string): Promise<string[]> {
  const data = await request<{ name: string; iso2: string; states: { name: string; state_code?: string }[] }>('/countries/states', { country })
  return data.states.map(state => state.name)
}

export async function getCities(country: string, state: string): Promise<string[]> {
  return request<string[]>('/countries/state/cities', { country, state })
}

export async function getCityPopulation(country: string, state?: string): Promise<PopulationCity[]> {
  const cities = await request<PopulationCity[]>('/countries/population/cities', { country })
  return state ? cities.filter(city => !city.state || city.state.toLowerCase() === state.toLowerCase()) : cities
}

export const fallbackCountries: Country[] = [
  { name: 'Germany', iso2: 'DE' }, { name: 'Thailand', iso2: 'TH' }, { name: 'United Kingdom', iso2: 'GB' },
  { name: 'United States', iso2: 'US' }, { name: 'France', iso2: 'FR' }, { name: 'Netherlands', iso2: 'NL' },
]

export const fallbackStates: Record<string, string[]> = {
  Germany: ['Bavaria', 'Berlin', 'Hesse', 'North Rhine-Westphalia', 'Hamburg'],
  Thailand: ['Bangkok', 'Chiang Mai', 'Phuket'],
  'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
}

export const fallbackCities: Record<string, string[]> = {
  Berlin: ['Berlin'], Bavaria: ['Munich'], Hesse: ['Frankfurt'], Hamburg: ['Hamburg'],
  Bangkok: ['Bangkok'], 'Chiang Mai': ['Chiang Mai'], Phuket: ['Phuket'], England: ['London'],
}
