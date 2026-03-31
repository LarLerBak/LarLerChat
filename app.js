// Remplace ce fichier par ton app.js avec Firebase
const input = document.getElementById('msg-input');
const trigger = document.getElementById('send-trigger');
const feed = document.getElementById('feed');
const streakCount = document.getElementById('streak-count');

// Simulation de l'augmentation des flammes
let currentStreak = parseInt(streakCount.innerText);

function sendMessage() {
    const text = input.value.trim();
    if (text === "") return;

    // Création de la bulle
    const pill = document.createElement('div');
    pill.className = 'msg-pill sent';
    pill.innerHTML = `<p>${text}</p>`;
    
    feed.appendChild(pill);
    input.value = "";
    
    // Auto-scroll très fluide
    feed.scrollTo({
        top: feed.scrollHeight,
        behavior: 'smooth'
    });

    // Gamification : Augmenter la flamme visuellement après l'envoi
    currentStreak++;
    streakCount.innerText = currentStreak;
    streakCount.parentElement.style.transform = 'scale(1.2)';
    setTimeout(() => {
        streakCount.parentElement.style.transform = 'scale(1)';
    }, 200);
}

trigger.addEventListener('click', sendMessage);
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
