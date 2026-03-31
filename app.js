import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, increment, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. CONFIGURATION (Vérifie bien ton authDomain ici)
const firebaseConfig = {
    apiKey: "TON_API_KEY",
    authDomain: "lerlarchat.firebaseapp.com", 
    projectId: "lerlarchat",
    storageBucket: "lerlarchat.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Configuration optionnelle pour éviter certains bugs de popup
provider.setCustomParameters({ prompt: 'select_account' });

// --- NAVIGATION AUTH ---
window.showAuth = (type) => {
    document.querySelectorAll('.auth-view').forEach(v => v.classList.add('hidden'));
    document.querySelectorAll('.auth-tabs button').forEach(b => b.classList.remove('active'));
    document.getElementById(`${type}-form`).classList.remove('hidden');
    document.getElementById(`tab-${type}`).classList.add('active');
};

// --- CONNEXION GOOGLE (AVEC GESTION D'ERREUR) ---
document.getElementById('google-signin-btn').onclick = async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Erreur Google Auth:", error.code, error.message);
        if (error.code === 'auth/unauthorized-domain') {
            alert("Erreur : Ce domaine n'est pas autorisé dans la console Firebase (Authentication > Settings > Authorized Domains).");
        } else if (error.code === 'auth/popup-closed-by-user') {
            console.log("Fenêtre fermée par l'utilisateur.");
        } else {
            alert("Erreur de connexion : " + error.message);
        }
    }
};

// --- INSCRIPTION EMAIL ---
document.getElementById('btn-signup-email').onclick = async () => {
    const userField = document.getElementById('signup-user').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const pass = document.getElementById('signup-password').value;

    if(!userField || !email || !pass) return alert("Remplis tous les champs !");

    try {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(res.user, { displayName: userField });
        // Forcer la mise à jour de l'UI après le pseudo
        location.reload(); 
    } catch (e) { alert("Erreur : " + e.message); }
};

// --- CONNEXION EMAIL ---
document.getElementById('btn-login-email').onclick = async () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value;
    try { 
        await signInWithEmailAndPassword(auth, email, pass); 
    } catch (e) { alert("Compte introuvable ou mauvais mot de passe."); }
};

// --- DÉCONNEXION ---
document.getElementById('btn-logout').onclick = () => signOut(auth);

// --- SURVEILLANCE DE L'ÉTAT (ON / OFF) ---
onAuthStateChanged(auth, (user) => {
    const overlay = document.getElementById('auth-overlay');
    const content = document.getElementById('app-content');
    
    if (user) {
        overlay.classList.add('hidden');
        content.classList.remove('hidden');
        
        // Affichage pseudo et avatar
        const displayName = user.displayName || "Utilisateur";
        document.getElementById('username-display').innerText = displayName;
        
        if(user.photoURL) {
            const img = document.getElementById('user-avatar');
            img.src = user.photoURL;
            img.style.display = 'block';
            document.getElementById('avatar-placeholder').style.display = 'none';
        }
        
        initAppData(user);
    } else {
        overlay.classList.remove('hidden');
        content.classList.add('hidden');
    }
});

// --- INITIALISATION DES DONNÉES TEMPS RÉEL ---
function initAppData(user) {
    const userRef = doc(db, "users", user.uid);
    
    // 1. Mise à jour profil Firestore
    setDoc(userRef, { 
        name: user.displayName || "Anonyme", 
        online: true, 
        lastSeen: serverTimestamp(),
        photo: user.photoURL || ""
    }, { merge: true });

    // 2. Écoute des messages (limitée aux 50 derniers pour la performance)
    const qMsg = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    onSnapshot(qMsg, (snap) => {
        const feed = document.getElementById('feed');
        feed.innerHTML = "";
        snap.forEach(d => {
            const m = d.data();
            const isMe = m.uid === user.uid;
            const div = document.createElement('div');
            div.className = `msg-pill ${isMe ? 'sent' : 'received'}`;
            div.innerHTML = `
                ${!isMe ? `<span class="sender">${m.user}</span>` : ''}
                <p>${m.text}</p>
            `;
            feed.appendChild(div);
        });
        feed.scrollTop = feed.scrollHeight;
    });

    // 3. Écoute du compteur de Flammes (Streaks)
    onSnapshot(userRef, (d) => {
        if(d.exists()) {
            document.getElementById('streak-count').innerText = d.data().streak || 0;
        }
    });

    // 4. Liste des contacts en ligne
    onSnapshot(collection(db, "users"), (snap) => {
        const list = document.getElementById('users-list');
        list.innerHTML = "";
        snap.forEach(d => {
            const u = d.data();
            if(d.id === user.uid) return;
            list.innerHTML += `
                <div class="contact-card">
                    <div class="avatar-mini" style="background-image: url('${u.photo || ''}'); background-size: cover;"></div>
                    <div>
                        <strong>${u.name}</strong><br>
                        <small>${u.online ? '🟢 En ligne' : '⚪ Hors-ligne'}</small>
                    </div>
                </div>`;
        });
    });
}

// --- ENVOI DE MESSAGE ---
const input = document.getElementById('msg-input');
async function send() {
    const text = input.value.trim();
    if (!text || !auth.currentUser) return;
    
    input.value = "";
    try {
        await addDoc(collection(db, "messages"), { 
            text: text, 
            user: auth.currentUser.displayName, 
            uid: auth.currentUser.uid, 
            createdAt: serverTimestamp() 
        });
        
        // Bonus : Incrémenter les flammes à chaque message envoyé
        await setDoc(doc(db, "users", auth.currentUser.uid), { 
            streak: increment(1) 
        }, { merge: true });
    } catch (e) {
        console.error("Erreur envoi:", e);
    }
}

document.getElementById('send-trigger').onclick = send;
input.onkeypress = (e) => { if (e.key === 'Enter') send(); };

// --- NAVIGATION TABS ---
window.switchTab = (tab, btn) => {
    document.querySelectorAll('.view-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    if(tab === 'chat') {
        document.getElementById('feed').classList.remove('hidden');
        document.getElementById('chat-controls').style.display = 'block';
    } else {
        document.getElementById('contacts-view').classList.remove('hidden');
        document.getElementById('chat-controls').style.display = 'none';
    }
};
