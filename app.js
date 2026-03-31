document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('chat-form');
    const input = document.getElementById('msg-input');
    const container = document.getElementById('messages-container');

    // Fonction pour ajouter un message à l'écran
    const addMessage = (text, user = "Utilisateur") => {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message');
        msgDiv.innerHTML = `
            <span class="user">${user}:</span>
            <p>${text}</p>
        `;
        container.appendChild(msgDiv);
        
        // Scroll automatique vers le bas
        container.scrollTop = container.scrollHeight;
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = input.value.trim();

        if (message !== "") {
            addMessage(message, "Moi");
            input.value = ""; // Vide le champ
            
            // Simulation d'une réponse auto (pour le test)
            setTimeout(() => {
                if(message.toLowerCase().includes("salut")) {
                    addMessage("Salut ! Bienvenue sur LarLerCaht.", "Bot");
                }
            }, 500);
        }
    });
});
