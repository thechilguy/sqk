const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0d1117;
    color: #e6edf3;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .card {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 12px;
    padding: 2rem;
    width: 100%;
    max-width: 380px;
  }

  .logo {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .logo svg {
    width: 40px;
    height: 40px;
    fill: #58a6ff;
  }

  h1 {
    text-align: center;
    font-size: 1.25rem;
    font-weight: 600;
    color: #e6edf3;
    margin-bottom: 1.5rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    font-size: 0.8125rem;
    font-weight: 500;
    color: #8b949e;
    margin-bottom: 0.375rem;
  }

  input {
    width: 100%;
    padding: 0.5625rem 0.75rem;
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 6px;
    color: #e6edf3;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  input:focus {
    border-color: #58a6ff;
    box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.12);
  }

  input::placeholder { color: #484f58; }

  .btn {
    display: block;
    width: 100%;
    padding: 0.5625rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, opacity 0.15s;
    margin-top: 1.25rem;
  }

  .btn-primary {
    background: #238636;
    color: #fff;
  }

  .btn-primary:hover { background: #2ea043; }
  .btn-primary:active { background: #1f7a2f; }

  .btn-ghost {
    background: transparent;
    color: #8b949e;
    border: 1px solid #30363d;
    margin-top: 0.625rem;
  }

  .btn-ghost:hover { background: #21262d; color: #e6edf3; }

  .alert {
    display: none;
    padding: 0.625rem 0.875rem;
    border-radius: 6px;
    font-size: 0.8125rem;
    margin-bottom: 1rem;
    line-height: 1.4;
  }

  .alert-error {
    background: rgba(248, 81, 73, 0.1);
    border: 1px solid rgba(248, 81, 73, 0.4);
    color: #f85149;
  }

  .alert-success {
    background: rgba(35, 134, 54, 0.1);
    border: 1px solid rgba(35, 134, 54, 0.4);
    color: #3fb950;
  }

  .footer {
    text-align: center;
    margin-top: 1.25rem;
    font-size: 0.8125rem;
    color: #8b949e;
  }

  .footer a {
    color: #58a6ff;
    text-decoration: none;
  }

  .footer a:hover { text-decoration: underline; }

  .divider {
    border: none;
    border-top: 1px solid #30363d;
    margin: 1.25rem 0;
  }

  /* Home page */
  .home-card {
    max-width: 480px;
    text-align: center;
  }

  .welcome-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .welcome-text {
    font-size: 1.375rem;
    font-weight: 600;
    color: #e6edf3;
    margin-bottom: 0.5rem;
  }

  .welcome-sub {
    color: #8b949e;
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
  }

  .token-badge {
    display: inline-block;
    background: rgba(88, 166, 255, 0.1);
    border: 1px solid rgba(88, 166, 255, 0.3);
    color: #58a6ff;
    padding: 0.25rem 0.75rem;
    border-radius: 2rem;
    font-size: 0.75rem;
    font-family: monospace;
    margin-bottom: 1.5rem;
    word-break: break-all;
    max-width: 100%;
  }
`;

const icon = `
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1a11 11 0 1 0 11 11A11 11 0 0 0 12 1zm0 4a4 4 0 1 1-4 4 4 4 0 0 1 4-4zm0 14a8.56 8.56 0 0 1-6.85-3.44C5.15 13.73 9.27 12 12 12s6.85 1.73 6.85 3.56A8.56 8.56 0 0 1 12 19z"/>
  </svg>
`;

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>${css}</style>
</head>
<body>
  ${body}
</body>
</html>`;
}

export function loginPage(): string {
  return layout('Login', `
    <div class="card">
      <div class="logo">${icon}</div>
      <h1>Sign in</h1>

      <div class="alert alert-error" id="error"></div>

      <form id="loginForm">
        <div class="form-group">
          <label for="email">Email address</label>
          <input type="email" id="email" name="email" placeholder="you@example.com" required autocomplete="email" />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" placeholder="••••••••" required autocomplete="current-password" />
        </div>
        <button type="submit" class="btn btn-primary" id="submitBtn">Sign in</button>
      </form>

      <hr class="divider" />

      <div class="footer">
        Don't have an account? <a href="/ui/register">Register</a>
      </div>
    </div>

    <script>
      // Redirect if already logged in
      if (localStorage.getItem('token')) window.location.href = '/ui/home';

      const form = document.getElementById('loginForm');
      const errorEl = document.getElementById('error');
      const submitBtn = document.getElementById('submitBtn');

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in…';

        try {
          const res = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: document.getElementById('email').value,
              password: document.getElementById('password').value,
            }),
          });

          const data = await res.json();

          if (res.ok) {
            localStorage.setItem('token', data.access_token);
            window.location.href = '/ui/home';
          } else {
            errorEl.textContent = data.message || 'Login failed. Please try again.';
            errorEl.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign in';
          }
        } catch {
          errorEl.textContent = 'Network error. Please try again.';
          errorEl.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign in';
        }
      });
    </script>
  `);
}

export function registerPage(): string {
  return layout('Register', `
    <div class="card">
      <div class="logo">${icon}</div>
      <h1>Create account</h1>

      <div class="alert alert-error" id="error"></div>
      <div class="alert alert-success" id="success"></div>

      <form id="registerForm">
        <div class="form-group">
          <label for="email">Email address</label>
          <input type="email" id="email" name="email" placeholder="you@example.com" required autocomplete="email" />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" placeholder="••••••••" required minlength="6" autocomplete="new-password" />
        </div>
        <button type="submit" class="btn btn-primary" id="submitBtn">Create account</button>
      </form>

      <hr class="divider" />

      <div class="footer">
        Already have an account? <a href="/ui/login">Sign in</a>
      </div>
    </div>

    <script>
      const form = document.getElementById('registerForm');
      const errorEl = document.getElementById('error');
      const successEl = document.getElementById('success');
      const submitBtn = document.getElementById('submitBtn');

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.style.display = 'none';
        successEl.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account…';

        try {
          const res = await fetch('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: document.getElementById('email').value,
              password: document.getElementById('password').value,
            }),
          });

          const data = await res.json();

          if (res.ok) {
            successEl.textContent = 'Account created! Redirecting to login…';
            successEl.style.display = 'block';
            form.reset();
            setTimeout(() => window.location.href = '/ui/login', 1500);
          } else {
            errorEl.textContent = data.message || 'Registration failed. Please try again.';
            errorEl.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create account';
          }
        } catch {
          errorEl.textContent = 'Network error. Please try again.';
          errorEl.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create account';
        }
      });
    </script>
  `);
}

export function homePage(): string {
  return layout('Home', `
    <div class="card home-card">
      <div class="welcome-icon">&#128075;</div>
      <div class="welcome-text" id="welcomeText">Welcome home!</div>
      <div class="welcome-sub">You are authenticated</div>
      <div class="token-badge" id="tokenBadge"></div>
      <button class="btn btn-ghost" onclick="logout()">Sign out</button>
    </div>

    <script>
      const token = localStorage.getItem('token');

      if (!token) {
        window.location.href = '/ui/login';
      } else {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          document.getElementById('welcomeText').textContent = 'Welcome home, ' + payload.email + '!';
          document.getElementById('tokenBadge').textContent = 'JWT · exp ' + new Date(payload.exp * 1000).toLocaleDateString();
        } catch {
          window.location.href = '/ui/login';
        }
      }

      function logout() {
        localStorage.removeItem('token');
        window.location.href = '/ui/login';
      }
    </script>
  `);
}
