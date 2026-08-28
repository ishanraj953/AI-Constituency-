content = open('src/services/api.js', encoding='utf-8').read()

interceptor_code = """
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
"""

if "api.interceptors.request.use" not in content:
    # insert it right before the response interceptor
    content = content.replace("api.interceptors.response.use", interceptor_code + "\napi.interceptors.response.use")
    open('src/services/api.js', 'w', encoding='utf-8').write(content)
