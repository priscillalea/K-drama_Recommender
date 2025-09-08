/**
* What this file does:
 * - Hides the navbar on scroll down and shows it on scroll up
 * - Smooth-scrolls between landing and recommendation sections
 * - Toggles the mobile navigation menu
 * - Provides a tiny in-memory autocomplete list of titles
 * - Fetches recommendations from the Flask API and renders “cards”
 * - Renders platform “chips” (e.g., Netflix, Viki) inside each card
 *
 * Assumptions / contracts with the backend:
 * - Endpoint: GET http://127.0.0.1:5000/recommend?title=<string>
 * - JSON response contains: { input, input_description, recommendations: [{ title, genres, styles, platform, description, similarity }] }
 *   where:
 *     - genres: comma-separated string (e.g., "Romance, Comedy")
 *     - styles: string (e.g., "Office, Corporate")
 *     - platform: string (comma- or pipe-separated if multiple, e.g., "Netflix" or "Netflix, Viki")
 * - The HTML includes elements with IDs: dramaInput, autocomplete-list, recommend-btn, recommendations-grid, loading
 * - CSS defines .drama-card, .drama-genres, .genre-tag, .drama-platforms, .platform-chip, etc.
 */

// --- Navbar hide on scroll down / show on scroll up ---
const navbar = document.querySelector(".navbar");
let lastY = 0;

window.addEventListener("scroll", () => {
  const y = window.scrollY;
  // If the new scroll position is greater than the last one, user is going down -> hide navbar
  // Otherwise, user scrolled up -> show navbar
  navbar.style.top = y > lastY ? "-69px" : "0";
  lastY = y;
});

// soft scroll 
function scrollToRecommendations() {
    document.getElementById("recommendation-page").scrollIntoView({ behavior: "smooth" });
}

function scrollToLanding() {
    document.getElementById("landing-page").scrollIntoView({ behavior: "smooth" });
}

// Mobile menu
function toggleMobileMenu() {
    document.querySelector(".nav-links").classList.toggle("active");
}

// Lista of titles (same as in the backend)
const titles = [
  "Crash Landing on You","What's Wrong with Secretary Kim","Business Proposal",
  "Strong Woman Do Bong Soon","It's Okay to Not Be Okay","Goblin","Descendants of the Sun",
  "Weightlifting Fairy Kim Bok-Joo","True Beauty","Hometown Cha-Cha-Cha","My Mister",
  "The Glory","My Liberation Notes","Our Blues","Misaeng: Incomplete Life",
  "Twenty-Five Twenty-One","Sky Castle","Itaewon Class","The Red Sleeve","Vincenzo",
  "Welcome to Waikiki","Mr. Queen","The Sound of Your Heart","Chief Kim","Gaus Electronics",
  "Prison Playbook","Signal","Flower of Evil","Beyond Evil","My Name","Kingdom",
  "Mouse","The K2","All of Us Are Dead","Healer","Vagabond","D.P.","The Uncanny Counter",
  "Lawless Lawyer","Stranger","W","Suspicious Partner","The Guest","Memorist",
  "Tell Me What You Saw","Tunnel","Hotel Del Luna","A Korean Odyssey","Legend of the Blue Sea",
  "Doom at Your Service","The King: Eternal Monarch","I'm Not a Robot","My Love from the Star",
  "Sisyphus: The Myth","Memories of the Alhambra","Circle","Duel","My Holo Love","Alice",
  "Are You Human Too?","L.U.C.A.: The Beginning","Moon Lovers: Scarlet Heart Ryeo",
  "Hwarang","The King's Affection","100 Days My Prince","Jang Ok-jung, Living by Love",
  "Rookie Historian Goo Hae-ryung","Sungkyunkwan Scandal","Voice","The Fiery Priest",
  "Extraordinary Attorney Woo","Hyena","I Can Hear Your Voice","Defendant","Good Partner",
  "Divorce Attorney Shin","Hospital Playlist","Dr. Romantic","It's Okay, That's Love",
  "Doctor Stranger","Doctors","Good Doctor","Yong-pal","Ghost Doctor","D-Day",
  "Who Are You: School 2015","Reply 1988","My ID is Gangnam Beauty","Love Alarm",
  "Sassy Go Go","Our Beloved Summer","Age of Youth","Navillera","Dream High","You're Beautiful",
  "Reply 1997","Do Do Sol Sol La La Sol","The Liar and His Lover","Heartstrings",
  "Persevere, Goo Hae Ra","The Producers","The Best Hit","Hit the Top","Racket Boys",
  "Fight For My Way","Hot Stove League","The Fabulous","Reply 1994","Run On","Love All Play"
];

// Autocomplete
const input = document.getElementById("dramaInput");
const autocompleteList = document.getElementById("autocomplete-list");

input.addEventListener("input", () => {
    // 1) Normalize input
    const val = input.value.toLowerCase().trim();
    // 2) Clear previous suggestions
    autocompleteList.innerHTML = "";
    if (!val) return;
    // 3) Filter titles that include the typed substring (case-insensitive)
    const matches = titles.filter(title => title.toLowerCase().includes(val)).slice(0,5);
    // 4) Render up to 5 suggestions; clicking a suggestion fills the input and clears the list
    matches.forEach(match => {
        const li = document.createElement("li");
        li.textContent = match;
        li.addEventListener("click", () => {
            input.value = match;
            autocompleteList.innerHTML = "";
        });
        autocompleteList.appendChild(li);
    });
});

// --- Platform chip renderer
// Accepts a string like "Netflix" or "Netflix, Viki" or "Netflix|Viki"
// Splits it and returns a string with <span class="platform-chip">...</span> for each platform
function renderPlatforms(p) {
  if (!p) return "";
  return p.split(/[|,]/).map(x => 
    `<span class="platform-chip">${x.trim()}</span>`
  ).join("");
}
// --- Recommendations: fetch from API and render cards ---
document.getElementById("recommend-btn").addEventListener("click", buscarRecomendacoes);
async function buscarRecomendacoes() {
     // Cache references to UI containers
    const titulo = input.value.trim();
    const resultado = document.getElementById("recommendations-grid");
    const loading = document.getElementById("loading");
    // Reset current results and show loader
    resultado.innerHTML = "";
    loading.classList.remove("hidden");

    try {
        // Call Flask endpoint; the backend performs the similarity search
        const res = await fetch(`http://127.0.0.1:5000/recommend?title=${encodeURIComponent(titulo)}`);
        // If the backend returns a non-2xx status, throw to the catch block
        if (!res.ok) throw new Error("K-Drama não encontrado.");
        // Parse response JSON and hide loader
        const data = await res.json();
        loading.classList.add("hidden");
        // Guard: empty recommendations
        if (!data.recommendations || data.recommendations.length === 0) {
            resultado.innerHTML = "<p>Nenhuma recomendação encontrada.</p>";
            return;
        }
        // Build and append a “card” per recommendation
        data.recommendations.forEach(drama => {
            const card = document.createElement("div");
            card.className = "drama-card";
            card.innerHTML = `
                <h3 class="drama-title">${drama.title}</h3>
                <div class="drama-genres">
                    <span class="genre-tag">${drama.styles}</span>
                    ${drama.genres
                      .split(",")
                      .map((g) => `<span class="genre-tag">${g.trim()}</span>`)
                      .join("")}
                </div>
                  <div class="drama-platforms">
    ${renderPlatforms(drama.platform)}
  </div>
                <p class="drama-description">${drama.description}</p>
                <p>Compatibility: <strong>${drama.similarity}%</strong></p>
            `;
            resultado.appendChild(card);
        });
        // Smooth-scroll down to the results grid
        scrollToRecommendations();
    } catch (err) {
        // Hide loader and render a visible error
        loading.classList.add("hidden");
        console.error(err);
        resultado.innerHTML = `<p style="color:red;">Erro: ${err.message}</p>`;
    }
}

// End of script.js