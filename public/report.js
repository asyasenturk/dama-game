document.getElementById("sendReportBtn").addEventListener("click", () => {
  const message = document.getElementById("reportText").value;
  const username = localStorage.getItem("username");

  fetch("/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, username })
  })
    .then(res => res.json())
    .then(data => {
      alert("Gönderildi!");
      window.location.href = "index.html";
    })
    .catch(err => {
      alert("Hata oluştu.");
      console.error(err);
    });
});
