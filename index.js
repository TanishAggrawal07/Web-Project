document.addEventListener("DOMContentLoaded", () => {
  // -------------------- FETCH HOMEPAGE CONTENT --------------------
  fetch("./homepage-content.json")
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // -------------------- TESTIMONIALS --------------------
      const testimonialsContainer = document.getElementById("testimonials-container");
      testimonialsContainer.innerHTML = ""; // Clear loading text

      if (data.testimonials && data.testimonials.length > 0) {
        data.testimonials.forEach(item => {
          const card = document.createElement("div");
          card.classList.add("card");
          card.innerHTML = `
            <p>"${item.quote}"</p>
            <p style="font-style: italic; margin-top: 1rem; color: #4b5563;">
              ${item.author}
            </p>
          `;
          testimonialsContainer.appendChild(card);
        });
      } else {
        testimonialsContainer.innerHTML = "<p>No testimonials found.</p>";
      }

      // -------------------- CORE BENEFITS --------------------
      const benefitsContainer = document.getElementById("core-benefits-container");
      benefitsContainer.innerHTML = ""; // Clear loading text

      if (data.coreBenefits && data.coreBenefits.length > 0) {
        data.coreBenefits.forEach(benefit => {
          const card = document.createElement("div");
          card.classList.add("card");
          card.innerHTML = `
            <h3>${benefit.title}</h3>
            <p>${benefit.description}</p>
          `;
          benefitsContainer.appendChild(card);
        });
      } else {
        benefitsContainer.innerHTML = "<p>No core benefits found.</p>";
      }
    })
    .catch(error => {
      console.error("Error loading homepage content:", error);
      document.getElementById("testimonials-container").innerHTML =
        "<p style='color:red;'>Failed to load testimonials.</p>";
      document.getElementById("core-benefits-container").innerHTML =
        "<p style='color:red;'>Failed to load core benefits.</p>";
    });

  // -------------------- BUTTON ALERTS --------------------
  const accessBtn = document.getElementById("access-platform-btn");
  const demoBtn = document.getElementById("watch-demo-btn");

  if (accessBtn) {
    accessBtn.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Platform access is currently restricted to registered colleges only.");
    });
  }

  if (demoBtn) {
    demoBtn.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Demo video coming soon! Stay tuned.");
    });
  }
});
