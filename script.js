// Navigation entre les salles
const scenes = document.querySelectorAll('.scene');
let currentSceneIndex = 0;

function showScene(index) {
    scenes.forEach((scene, i) => {
        scene.classList.remove('active');
        if (i === index) {
            scene.classList.add('active');
            // Mise à jour de l'indicateur
            document.getElementById('current-room').innerText = `Salle ${i}`;
        }
    });
}

// SCÈNE 1 : Interaction Ticket
const ticket = document.getElementById('ticket');
ticket.addEventListener('click', () => {
    // Simulation du déchirement
    ticket.style.transform = 'translateX(100px) rotate(10deg)';
    ticket.style.opacity = '0';
    
    // Son de papier (à ajouter via Audio API si fichier dispo)
    // const tearSound = new Audio('tear.mp3'); tearSound.play();

    setTimeout(() => {
        showScene(1); // Passe à la Salle 2 (index 1)
    }, 500);
});

// SCÈNE 2 : Lecteur Musical
const trackBtns = document.querySelectorAll('.track-btn');
trackBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const videoId = btn.getAttribute('data-video');
        const video = document.getElementById(videoId);
        const player = document.querySelector('.video-player');
        
        player.classList.remove('hidden');
        video.play();
        // Logique pour arrêter les autres vidéos
    });
});

// SCÈNE 3 : Timeline Interactive (Slider)
const slider = document.getElementById('brand-slider');
const motionLayer = document.querySelector('.motion-layer');

slider.addEventListener('input', (e) => {
    const val = e.target.value;
    // L'opacité de la couche "motion" augmente avec le slider
    motionLayer.style.opacity = val / 100;
});

// SCÈNE 5 : Transition vers la carte
function openPopup() {
    // Ici, on pourrait passer à la scène 6 ou ouvrir la carte directement
    document.getElementById('business-card-overlay').classList.remove('hidden');
}

// Navigation au scroll (Optionnel pour fluidifier)
window.addEventListener('wheel', (e) => {
    if (e.deltaY > 0 && currentSceneIndex < scenes.length - 1) {
        currentSceneIndex++;
        showScene(currentSceneIndex);
    } else if (e.deltaY < 0 && currentSceneIndex > 0) {
        currentSceneIndex--;
        showScene(currentSceneIndex);
    }
});
