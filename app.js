// ===== CONFIGURATION =====
const CONFIG = {
// Registration/write actions ke liye — caching nahi chahiye
FUNCTIONS_BASE: 'https://us-central1-seva-connect-backend.cloudfunctions.net',
// Read-only GET endpoints — Hosting CDN cache ke liye isi se call karo
CACHED_API_BASE: 'https://seva-connect-backend.web.app/api',
// YouTube Channel ID
YT_CHANNEL: 'YOUR_CHANNEL_ID',
// WhatsApp Number
WA_NUMBER: '919858105224',
// Social Media Links
INSTAGRAM: 'https://instagram.com/officialsevaconnect',
FACEBOOK: 'https://facebook.com/officialsevaconnect',
YOUTUBE: 'https://youtube.com/@officialsevaconnect'
};

// ===== LIVE COUNTER ANIMATION =====
function animateCounter(elementId, target, duration = 2000) {
  const element = document.getElementById(elementId);
  if (!element) return;
  let start = 0;
  const increment = target / (duration / 16);
  const timer = setInterval(() => {
    start += increment;
    if (start >= target) {
      element.textContent = target.toLocaleString('en-IN');
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(start).toLocaleString('en-IN');
    }
  }, 16);
}

// ===== FETCH STATS FROM GOOGLE SHEETS =====
async function loadStats() {
  try {
    const response = await fetch(CONFIG.CACHED_API_BASE + '/getStats');
    const data = await response.json();
    // Hero stats bar
    animateCounter('totalMatches', data.matches || 0);
    animateCounter('totalMadadgars', data.madadgars || 0);
    animateCounter('totalCities', data.cities || 0);
    // Impact section (same numbers, different IDs)
    animateCounter('i-matches', data.matches || 0);
    animateCounter('i-madadgars', data.madadgars || 0);
    animateCounter('i-cities', data.cities || 0);
  } catch (error) {
    // Fallback numbers — jab tak backend live nahi hota
    animateCounter('totalMatches', 127);
    animateCounter('totalMadadgars', 340);
    animateCounter('totalCities', 28);
    animateCounter('i-matches', 127);
    animateCounter('i-madadgars', 340);
    animateCounter('i-cities', 28);
  }
}

// ===== LOAD ZARURAT VIDEOS (Active Cases) =====
async function loadZaruratVideos() {
  try {
    const response = await fetch(CONFIG.CACHED_API_BASE + '/getActiveCases');
    const result = await response.json();
    // Code.gs ka getActiveCases() { cases: [...] } shape mein wrap karke bhejta hai
    const cases = result && result.cases ? result.cases : [];
    const container = document.getElementById('activeCases');
    if (!container || !cases.length) return;
    container.innerHTML = '';
    cases.slice(0, 6).forEach(caseItem => {
      const card = createCaseCard(caseItem);
      container.appendChild(card);
      revealObserver.observe(card);
    });
  } catch (error) {
    console.log('Cases load error:', error);
    // Sample card jo HTML mein already hai woh as-is rahega (fallback)
  }
}

// ===== CREATE CASE CARD (Zarurat) =====
function createCaseCard(data) {
  const card = document.createElement('div');
  card.className = 'case-card';
  const categoryEmoji = {
    'food': '🍚',
    'education': '📚',
    'medical': '🏥',
    'shelter': '🏠',
    'clothes': '👕',
    'skills': '💼',
    'elderly': '👴',
    'emergency': '🚨'
  };
  const emoji = categoryEmoji[data.category] || '🤝';
  // Code.gs ka getActiveCases() 'youtubeLink' field deta hai (full URL), 'youtubeId' nahi
  const videoId = extractYouTubeId(data.youtubeLink);
  card.innerHTML = `
    <div class="case-video">
      ${videoId ? `<iframe src="https://www.youtube.com/embed/${videoId}?rel=0" allowfullscreen loading="lazy"></iframe>` : ''}
    </div>
    <div class="case-info">
      <div class="case-badges">
        <span class="badge-verified">✅ Verified</span>
        <span class="badge-category">${emoji} ${data.category}</span>
        ${data.urgency >= 8 ? '<span class="badge-urgent">🔴 Urgent</span>' : ''}
      </div>
      <h3>${data.name} - ${data.city}</h3>
      <p>"${data.story}"</p>
      <div class="case-need">
        <span>💰 Zarurat: ₹${data.amountNeeded}</span>
        <span>📍 ${data.city}</span>
      </div>
      <div class="case-actions">
        <a href="register-madadgar.html?case=${data.id}" class="btn-help-now">❤️ Abhi Help Karo</a>
        <button class="btn-share-case" onclick="shareCase('${data.id}','${data.name}','${data.city}')">📤 Share</button>
      </div>
    </div>
  `;
  return card;
}

// Helper: YouTube URL se video ID extract karta hai (kai URL formats handle karta hai)
function extractYouTubeId(url) {
  if (!url) return null;
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// ===== LOAD SHUKRIYA STORIES =====
async function loadShukriyaStories() {
  try {
    const response = await fetch(CONFIG.CACHED_API_BASE + '/getShukriyaVideos');
    const result = await response.json();
    // Code.gs ka getShukriyaVideos() { videos: [...] } shape mein wrap karke bhejta hai
    const stories = result && result.videos ? result.videos : [];
    const container = document.getElementById('shukriyaStories');
    if (!container || !stories.length) return;
    container.innerHTML = '';
    stories.slice(0, 6).forEach(storyItem => {
      const card = createStoryCard(storyItem);
      container.appendChild(card);
      revealObserver.observe(card);
    });
  } catch (error) {
    console.log('Stories load error:', error);
  }
}

// ===== CREATE STORY CARD (Shukriya) =====
// NOTE: Code.gs ka getShukriyaVideos() sirf yeh fields deta hai:
// videoId, caseId, zaruratmandName, city, category, youtubeLink, youtubeVideoId, approvedDate
// Madadgar ka naam/badge yahan available NAHI hai (Code.gs Videos sheet se padhta hai,
// jisme MadadgarID hai par naam/badge lookup abhi implement nahi hai).
function createStoryCard(data) {
  const card = document.createElement('div');
  card.className = 'story-card';
  const videoId = data.youtubeVideoId || extractYouTubeId(data.youtubeLink);
  card.innerHTML = `
    <div class="story-video">
      ${videoId ? `<iframe src="https://www.youtube.com/embed/${videoId}?rel=0" allowfullscreen loading="lazy"></iframe>` : ''}
    </div>
    <div class="story-info">
      <div class="story-impact">🎉 Help Mili!</div>
      <h3>${data.zaruratmandName || 'Ek zarooratmand'} ki kahani — ${data.city || ''}</h3>
      <p>${data.category ? 'Category: ' + data.category : ''}</p>
      <button class="btn-share-story" onclick="shareStory('${data.caseId || ''}','${data.zaruratmandName || ''}')">📤 Is Kahani Ko Share Karo</button>
    </div>
  `;
  return card;
}

// ===== LOAD MADADGAR WALL OF FAME =====
async function loadMadadgarWall() {
  try {
    const response = await fetch(CONFIG.CACHED_API_BASE + '/getTopMadadgars');
    const result = await response.json();
    // Code.gs ka getTopMadadgars() { madadgars: [...] } shape mein wrap karke bhejta hai
    const madadgars = result && result.madadgars ? result.madadgars : [];
    const container = document.getElementById('madadgarWall');
    if (!container || !madadgars.length) return;
    container.innerHTML = '';
    madadgars.slice(0, 8).forEach(madadgar => {
      const card = document.createElement('div');
      card.className = 'donor-wall-card';
      card.innerHTML = `
        <div class="donor-avatar">👤</div>
        <div class="donor-name">${madadgar.name}</div>
        <div class="donor-badge">${madadgar.badge}</div>
        <div class="donor-city">📍 ${madadgar.city}</div>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.log('Madadgar wall error:', error);
  }
}

// ===== SHARE FUNCTIONS =====
function shareCase(caseId, name, city) {
  const url = `https://sevaconnect.in/cases.html?id=${caseId}`;
  const text = `🙏 Ek zaruratmand ko abhi madad chahiye!\n\n${name} (${city}) - verified case hai Seva Connect pe.\n\nKya aap ya aapka koi jaan-pehchaan ka madad kar sakta hai?\n\n${url}\n\nAapka ek share kisi ki zindagi badal sakta hai! 🤲`;
  showShareModal(text, url);
}

function shareStory(storyId, personName) {
  const url = `https://sevaconnect.in/stories.html?id=${storyId}`;
  const text = `❤️ Ek sachchi kahani!\n\n${personName} ki madad ho gayi hai — kisi Madadgar ne dil se seva ki! Yeh dekh ke dil khush ho gaya!\n\nAap bhi yeh feeling experience karo:\n${url}\n\n#SevaConnect #Insaniyat`;
  showShareModal(text, url);
}

function showShareModal(text, url) {
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const modal = document.createElement('div');
  modal.className = 'share-modal';
  modal.innerHTML = `
    <div class="share-modal-content">
      <h3>Share Karo 📤</h3>
      <p>Jitne zyada log dekhenge, utna jaldi help milegi!</p>
      <div class="share-buttons">
        <a href="${waUrl}" target="_blank" class="share-btn whatsapp">💬 WhatsApp</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" class="share-btn facebook">👥 Facebook</a>
        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}" target="_blank" class="share-btn twitter">🐦 Twitter</a>
        <button onclick="copyText('${url}')" class="share-btn copy">📋 Link Copy Karo</button>
      </div>
      <button onclick="closeModal()" class="close-modal">✕ Close</button>
    </div>
  `;
  document.body.appendChild(modal);
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Link copy ho gaya! Ab paste karke share karo 🙏');
  });
}

function closeModal() {
  const modal = document.querySelector('.share-modal');
  if (modal) modal.remove();
}

// ===== MOBILE MENU =====
function toggleNav() {
  const navLinks = document.getElementById('navLinks');
  if (navLinks) navLinks.classList.toggle('active');
}

// ===== SCROLL-REVEAL OBSERVER (Global Fix) =====
// style.css mein .step-card, .case-card, .story-card, .why-card, .cat-card,
// .impact-card, .benefit-card sab opacity:0 se shuru hote hain aur .visible
// class lagne par fade-in hote hain. Yeh single observer un sab real
// selectors ko target karta hai (purana code .step/.video-card/.category-card
// dhundta tha, jo kahin exist nahi karte the — isliye cards permanently
// invisible reh jaate the).
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

function initScrollReveal() {
  const revealSelectors = '.step-card, .case-card, .story-card, .why-card, .cat-card, .impact-card, .benefit-card';
  document.querySelectorAll(revealSelectors).forEach(el => revealObserver.observe(el));
}

// ===== MATCHING ALGORITHM (Client Side Preview) =====
// Yeh sirf frontend preview hai — asli matching Code.gs (backend) mein hoti
// hai. Kahin call nahi hoti abhi, future use ke liye rakha hai.
function findMatch(needyData, madadgarsData) {
  const priorities = ['pincode', 'city', 'state', 'country', 'global'];
  for (let priority of priorities) {
    let matches = madadgarsData.filter(madadgar => {
      const categoryMatch = madadgar.categories.includes(needyData.category);
      const budgetMatch = madadgar.budget >= needyData.amountNeeded;
      const availableMatch = madadgar.status === 'ACTIVE';
      let locationMatch = false;
      switch (priority) {
        case 'pincode':
          locationMatch = madadgar.pincode === needyData.pincode;
          break;
        case 'city':
          locationMatch = madadgar.city.toLowerCase() === needyData.city.toLowerCase();
          break;
        case 'state':
          locationMatch = madadgar.state.toLowerCase() === needyData.state.toLowerCase();
          break;
        case 'country':
          locationMatch = madadgar.reach === 'india' || madadgar.reach === 'global';
          break;
        case 'global':
          locationMatch = madadgar.reach === 'global';
          break;
      }
      return categoryMatch && budgetMatch && availableMatch && locationMatch;
    });
    if (matches.length > 0) {
      matches.sort((a, b) => (b.helpCount || 0) - (a.helpCount || 0));
      return { found: true, level: priority, madadgar: matches[0] };
    }
  }
  return { found: false, level: 'waitlist' };
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
  loadStats();
  loadZaruratVideos();
  loadShukriyaStories();
  loadMadadgarWall();
  initScrollReveal();
});