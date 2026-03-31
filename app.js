import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, addDoc, query, orderBy, onSnapshot, 
    serverTimestamp, doc, setDoc, increment 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. CONFIGURATION FIREBASE (Remplace par tes clés depuis la console Firebase)
const firebaseConfig = {
    apiKey: "TON_API_KEY",
    authDomain: "lerlarchat.firebaseapp.com",
    projectId: "lerlarchat",
    storageBucket: "lerlarchat.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

// Initialisation
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. GESTION DE L'UTILISATEUR
let currentUser = localStorage.getItem('lerlarchat-user');
if (!currentUser) {
    currentUser = prompt("Bienvenue sur LerLarChat ! Ton pseudo :") || "Anonyme";
    localStorage.setItem('lerlarchat-user', currentUser);
}

// Mise à jour de l'interface avec le pseudo
document.getElementById('username-display').innerText = currentUser;

// Références Firestore
const messagesCol = collection(db, "messages");
const userDocRef = doc(db, "users", currentUser);

// DOM Elements
const feed = document.getElementById('feed');
const input = document.getElementById('msg-input');
const trigger = document.getElementById('send-trigger');
const streakCount = document.getElementById('streak-count');

// 3. ÉCOUTE DES FLAMMES EN TEMPS RÉEL (La Rétention)
onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
        const data = docSnap.data();
        streakCount.innerText = data.streak || 0;
        
        // Petit effet visuel quand le score monte depuis la base de données
        streakCount.parentElement.style.transform = 'scale(1.2)';
        setTimeout(() => streakCount.parentElement.style.transform = 'scale(1)', 200);
    } else {
        // Initialiser le score à 0 si le joueur est nouveau
        streakCount.innerText = 0;
    }
});

// 4. RÉCEPTION DES MESSAGES
const q = query(messagesCol, orderBy("createdAt", "asc"));

onSnapshot(q, (snapshot) => {
    feed.innerHTML = ""; // Vide le feed avant de le re-remplir
    
    snapshot.forEach((doc) => {
        const data = doc.data();
        const isMe = data.user === currentUser;
        
        const pill = document.createElement('div');
        // Si c'est moi "sent", sinon "received"
        pill.className = `msg-pill ${isMe ? 'sent' : 'received'}`; 
        
        // On affiche le nom de l'expéditeur seulement si ce n'est pas nous
        const senderHtml = isMe ? '' : `<span class="sender">${data.user}</span>`;
        
        pill.innerHTML = `
            ${senderHtml}
            <p>${data.text}</p>
        `;
        feed.appendChild(pill);
    });
    
    // Scroll tout en bas pour voir le dernier message
    feed.scrollTop = feed.scrollHeight;
});

// 5. ENVOI DE MESSAGE ET AUGMENTATION DES FLAMMES
async function sendMessage() {
    const text = input.value.trim();
    if (text === "") return;

    // Vider l'input tout de suite pour la sensation de fluidité
    input.value = "";

    try {
        // A. Envoyer le message dans la base
        await addDoc(messagesCol, {
            text: text,
            user: currentUser,
            createdAt: serverTimestamp()
        });

        // B. Augmenter le Streak (les flammes) de 1 dans la base
        // setDoc avec { merge: true } crée le document s'il n'existe pas, ou le met à jour
        await setDoc(userDocRef, {
            streak: increment(1),
            lastActive: serverTimestamp()
        }, { merge: true });

    } catch (error) {
        console.error("Erreur lors de l'envoi :", error);
    }
}

// 6. ÉVÉNEMENTS (Clic et Touche Entrée)
trigger.addEventListener('click', sendMessage);
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
