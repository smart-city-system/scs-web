import http from '@/lib/http'

async function publish(cameraId: string, offer: any) {
  const url = `/cameras/${cameraId}/publish`
  return http.post(url, { offer })
}