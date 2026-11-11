// ID catcher
function id(id) {
    return document.getElementById(id)
}
// favIcon
const faviconIco = "https://assets.pokemon.com/static2/_ui/img/favicon.ico"
document.querySelector("#favIcon").href = faviconIco

// API
async function fetchPokemon() {
    try {
        let pokemonName = document.getElementById("pokemonName").value.toLowerCase()
        let response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`)

        if (!response.ok) {
            throw new Error("Could not fetch response")
        }

        let data = await response.json()
        let dataSprit = data.sprites.front_default
        let pokemonImg = document.getElementById("pokemonImg")
        pokemonImg.src = dataSprit
        pokemonImg.alt = pokemonName
        pokemonImg.style.display = "block"

    }
    catch (error) {
        console.error(error)
    }
}

// Menu icon toggle
id("menuIcon").addEventListener('click', () => {
    id("navLinks").classList.toggle("max-h-0");
    id("navLinks").classList.toggle("max-h-60");
    
    id("navLinks").classList.toggle("opacity-0");
    
    id("menuIcon").querySelector("i").classList.toggle("fa-bars");
    id("menuIcon").querySelector("i").classList.toggle("fa-xmark");
});
let navLink = document.querySelectorAll("#navLinks li");

navLink.forEach((link) => {
    link.addEventListener("click", () => {
        id("navLinks").classList.add("max-h-0");
        id("navLinks").classList.remove("max-h-60");

        id("navLinks").classList.add("opacity-0");
        id("navLinks").classList.remove("opacity-100");

        id("menuIcon").querySelector("i").classList.remove("fa-xmark");
        id("menuIcon").querySelector("i").classList.add("fa-bars");
    });
});