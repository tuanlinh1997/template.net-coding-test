const STORAGE_KEY = 'clientId'

export const getOrCreateClientId = () => {
  let clientId = localStorage.getItem(STORAGE_KEY)

  if (!clientId) {
    clientId = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, clientId)
  }

  return clientId
}