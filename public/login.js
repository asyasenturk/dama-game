document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = e.target.email.value.trim();
  const password = e.target.password.value;

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Giriş başarısız. Lütfen bilgilerini kontrol et.");
      return;
    }

    // Token ve kullanıcı adı localStorage'a kaydediliyor
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);

    // Başarılı girişten sonra anasayfaya yönlendir
    window.location.href = "index.html";
  } catch (err) {
    console.error("Login hatası:", err);
    alert("Sunucuya bağlanılamadı. Lütfen daha sonra tekrar dene.");
  }
});
