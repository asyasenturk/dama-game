const token = localStorage.getItem("token");
const username = localStorage.getItem("username");

if (!token || !username) {
  window.location.href = "login.html";
}

fetch(`/api/auth/profile/${username}`)
  .then(res => res.json())
  .then(data => {
    // Profil fotoğrafı
    const avatar = document.getElementById("profilePic");
    avatar.src = data.profilePic || "images/default-avatar.png";

    // Kullanıcı adı
    document.getElementById("username").textContent = data.username;

    // E-posta
    document.getElementById("email").textContent = "E-posta: " + (data.email || "yok");

    // Katılım tarihi
    if (data.createdAt) {
      const createdDate = new Date(data.createdAt).toLocaleDateString("tr-TR");
      document.getElementById("createdAt").textContent = "Katılım: " + createdDate;
    } else {
      document.getElementById("createdAt").textContent = "Katılım: bilinmiyor";
    }

    // İstatistikler
    if (data.stats) {
      document.getElementById("stats").innerHTML = `
        <b>Offline:</b> ${data.stats.offline.wins}W - ${data.stats.offline.losses}L<br>
        <b>Online:</b> ${data.stats.online.wins}W - ${data.stats.online.losses}L
      `;
    } else {
      document.getElementById("stats").textContent = "İstatistik yok.";
    }
  })
  .catch(err => {
    console.error("Profil verisi alınamadı:", err);
    document.getElementById("username").textContent = "Hata oluştu.";
  });

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}
