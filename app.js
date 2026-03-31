import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, increment, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// REMPLACE PAR TES CLÉS FIREBASE
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

// --- AUTH LOGIQUE ---
window.showAuth = (type) => {
    document.querySelectorAll('.auth-view').forEach(v => v.classList.add('hidden'));
    document.querySelectorAll('.auth-tabs button').forEach(b => b.classList.remove('active'));
    document.getElementById(`${type}-form`).classList.remove('hidden');
    document.getElementById(`tab-${type}`).classList.add('active');
};

document.getElementById('google-signin-btn').onclick = () => signInWithPopup(auth, provider);

document.getElementById('btn-signup-email').onclick = async () => {
    const user = document.getElementById('signup-user').value;
    const email = document.getElementById('signup-email').value;
    const pass = document.getElementById('signup-password').value;
    try {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(res.user, { displayName: user });
    } catch (e) { alert(e.message); }
};

document.getElementById('btn-login-email').onclick = async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    try { await signInWithEmailAndPassword(auth, email, pass); } catch (e) { alert(e.message); }
};

document.getElementById('btn-logout').onclick = () => signOut(auth);

// --- ÉTAT DE CONNEXION ---
onAuthStateChanged(auth, (user) => {
    const overlay = document.getElementById('auth-overlay');
    const content = document.getElementById('app-content');
    
    if (user) {
        overlay.classList.add('hidden');
        content.classList.remove('hidden');
        document.getElementById('username-display').innerText = user.displayName;
        if(user.photoURL) {
            document.getElementById('user-avatar').src = user.photoURL;
            document.getElementById('user-avatar').style.display = 'block';
            document.getElementById('avatar-placeholder').style.display = 'none';
        }
        initAppData(user);
    } else {
        overlay.classList.remove('hidden');
        content.classList.add('hidden');
    }
});

// --- DATA TEMPS RÉEL ---
function initAppData(user) {
    const userRef = doc(db, "users", user.uid);
    setDoc(userRef, { name: user.displayName, online: true, lastSeen: serverTimestamp() }, { merge: true });

    // Messages
    onSnapshot(query(collection(db, "messages"), orderBy("createdAt", "asc")), (snap) => {
        const feed = document.getElementById('feed');
        feed.innerHTML = "";
        snap.forEach(d => {
            const m = d.data();
            const isMe = m.uid === user.uid;
            const div = document.createElement('div');
            div.className = `msg-pill ${isMe ? 'sent' : 'received'}`;
            div.innerHTML = `${isMe ? '' : '<span class="sender">'+m.user+'</span>'}<p>${m.text}</p>`;
            feed.appendChild(div);
        });
        feed.scrollTop = feed.scrollHeight;
    });

    // Flammes
    onSnapshot(userRef, (d) => {
        if(d.exists()) document.getElementById('streak-count').innerText = d.data().streak || 0;
    });

    // Contacts
    onSnapshot(collection(db, "users"), (snap) => {
        const list = document.getElementById('users-list');
        list.innerHTML = "";
        snap.forEach(d => {
            const u = d.data();
            if(d.id === user.uid) return;
            list.innerHTML += `<div class="contact-card"><div class="avatar-mini"></div><div><strong>${u.name}</strong><br><small>${u.online ? '🟢 En ligne' : '⚪ Hors-ligne'}</small></div></div>`;
        });
    });
}

// --- ACTIONS ---
const input = document.getElementById('msg-input');
async function send() {
    if (!input.value.trim()) return;
    const text = input.value;
    input.value = "";
    await addDoc(collection(db, "messages"), { text, user: auth.currentUser.displayName, uid: auth.currentUser.uid, createdAt: serverTimestamp() });
    await setDoc(doc(db, "users", auth.currentUser.uid), { streak: increment(1) }, { merge: true });
}
document.getElementById('send-trigger').onclick = send;
input.onkeypress = (e) => e.key === 'Enter' && send();

window.switchTab = (tab, btn) => {
    document.querySelectorAll('.view-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(tab === 'chat' ? 'feed' : 'contacts-view').classList.remove('hidden');
    document.getElementById('chat-controls').style.display = tab === 'chat' ? 'block' : 'none';
};
