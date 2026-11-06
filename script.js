// PokeAPI --- https://pokeapi.co/

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
    catch(error){
        console.error(error)
    }
}