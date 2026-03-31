import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { /* TES INFOS FIREBASE */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Gestion du pseudo
let currentUser = localStorage.getItem('lerlarchat-user');
if (!currentUser) {
    currentUser = prompt("Bienvenue sur LerLarChat ! Ton pseudo :") || "Membre";
    localStorage.setItem('lerlarchat-user', currentUser);
}

// Récupération des messages
const feed = document.getElementById('feed');
const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));

onSnapshot(q, (snapshot) => {
    feed.innerHTML = "";
    snapshot.forEach(doc => {
        const data = doc.data();
        const card = document.createElement('div');
        card.className = 'message-card';
        card.innerHTML = `
            <div class="avatar-mini"></div>
            <div class="msg-content">
                <h4>${data.user} <span style="font-weight:400; font-size:10px; color:#475569">à ${new Date(data.createdAt?.toDate()).toLocaleTimeString()}</span></h4>
                <p>${data.text}</p>
            </div>
        `;
        feed.appendChild(card);
    });
    feed.scrollTop = feed.scrollHeight;
});

// Envoi de message
const input = document.getElementById('msg-input');
const trigger = document.getElementById('send-trigger');

async function send() {
    if (input.value.trim() === "") return;
    await addDoc(collection(db, "messages"), {
        user: currentUser,
        text: input.value,
        createdAt: serverTimestamp()
    });
    input.value = "";
}

trigger.addEventListener('click', send);
input.addEventListener('keypress', (e) => e.key === 'Enter' && send());
