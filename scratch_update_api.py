content = open('src/services/api.js', encoding='utf-8').read()

interceptor_code = """
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
"""

if "api.interceptors" not in content:
    content = content.replace("});", "});\n" + interceptor_code, 1)
    open('src/services/api.js', 'w', encoding='utf-8').write(content)
