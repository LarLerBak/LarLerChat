const chatWindow = document.getElementById('chat-window');
const input = document.getElementById('user-input');
const btn = document.getElementById('send-btn');

function sendMessage() {
    if (input.value.trim() === "") return;

    // Créer la bulle "Moi"
    const msg = document.createElement('div');
    msg.className = 'bubble sent';
    msg.innerHTML = `<p>${input.value}</p>`;
    
    chatWindow.appendChild(msg);
    
    // Reset et scroll
    input.value = "";
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // Petite interaction auto
    setTimeout(() => {
        const reply = document.createElement('div');
        reply.className = 'bubble received';
        reply.innerHTML = `<span class="sender">LarLer</span><p>Message reçu sur LarLerCaht ! ✅</p>`;
        chatWindow.appendChild(reply);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }, 1000);
}

btn.addEventListener('click', sendMessage);
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
