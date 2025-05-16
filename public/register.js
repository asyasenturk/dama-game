document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = e.target.username.value.trim();
  const email = e.target.email.value.trim();
  const password = e.target.password.value;

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Kayıt başarısız.");
      return;
    }

    alert("Kayıt başarılı! Şimdi giriş yapabilirsin.");
    window.location.href = "login.html";
  } catch (err) {
    console.error("Kayıt hatası:", err);
    alert("Sunucuya ulaşılamadı.");
  }
});
