function playPopSound() {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    audio.play().catch(e => console.log("Audio play failed:", e));
}
export default playPopSound;
