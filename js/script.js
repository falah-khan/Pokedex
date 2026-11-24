select("#favIcon").href = "https://assets.pokemon.com/static2/_ui/img/favicon.ico";

function select(selector) {
    return document.querySelector(selector);
}

function selectall(selector) {
    return document.querySelectorAll(selector);
}

const pokemonCardsContainer = select("#pokemonCardsContainer");
const loadMoreButton = select("#loadMoreButton");
const searchInput = select("#pokemonSearch");
const searchButton = select('#Search button[aria-label="Submit"]');
const suggestionsList = select("#pokemonSuggestions");
const clearSearchButton = select("#clearSearch");
const typeFilterButton = select("#typeFilterButton");
const typeFilterOptions = select("#typeFilterOptions");
const sortPokemonsButton = select("#sortPokemonsButton");
const sortPokemonsOptions = select("#sortPokemonsOptions");
const notFoundMessage = select("#notFoundMessage");
const menuButton = select("#menuIcon");
const navLinks = select("#navLinks");
const typeColors = {
    normal: "bg-stone-400", fire: "bg-red-500", water: "bg-blue-500",
    electric: "bg-yellow-400", grass: "bg-green-600", ice: "bg-cyan-400",
    fighting: "bg-orange-600", poison: "bg-purple-500", ground: "bg-amber-600",
    flying: "bg-sky-400", psychic: "bg-pink-500", bug: "bg-lime-600",
    rock: "bg-stone-600", ghost: "bg-violet-600", dragon: "bg-indigo-600",
    dark: "bg-slate-700", steel: "bg-slate-400", fairy: "bg-fuchsia-400"
};
let allPokemons = [];
let searchRequest = 0;
let activeSuggestionIndex = -1;
let pokemonTypesLoaded = false;
let selectedType = "";
let selectedSort = "number";
const pokemonBatchSize = 8;
let visiblePokemonCount = pokemonBatchSize;

function closeSuggestions() {
    suggestionsList.classList.add("hidden");
    suggestionsList.innerHTML = "";
    searchInput.setAttribute("aria-expanded", "false");
    searchInput.removeAttribute("aria-activedescendant");
    activeSuggestionIndex = -1;
}

function updateSuggestions() {
    const term = searchInput.value.trim().toLowerCase().replace(/^#\s*/, "");
    if (!term || !allPokemons.length) {
        closeSuggestions();
        return;
    }

    const matches = allPokemons.filter((pokemon) =>
        pokemon.name.startsWith(term) || String(pokemon.id).startsWith(term)
    ).slice(0, 8);

    suggestionsList.innerHTML = matches.map((pokemon, index) => `
        <li id="pokemon-suggestion-${index}" role="option" aria-selected="false" data-name="${pokemon.name}"
            class="cursor-pointer px-3 py-2 text-sm capitalize text-slate-700 hover:bg-slate-100">
            ${pokemon.name}<span class="float-right text-xs text-slate-400">#${pokemon.id}</span>
        </li>
    `).join("");
    suggestionsList.classList.toggle("hidden", matches.length === 0);
    searchInput.setAttribute("aria-expanded", String(matches.length > 0));
}

function chooseSuggestion(name) {
    searchInput.value = name;
    clearSearchButton.classList.remove("hidden");
    closeSuggestions();
    handleSearch();
}

function setActiveSuggestion(nextIndex) {
    const options = [...suggestionsList.querySelectorAll('[role="option"]')];
    if (!options.length) return;
    activeSuggestionIndex = (nextIndex + options.length) % options.length;
    options.forEach((option, index) => {
        const active = index === activeSuggestionIndex;
        option.setAttribute("aria-selected", String(active));
        option.classList.toggle("bg-slate-100", active);
    });
    searchInput.setAttribute("aria-activedescendant", options[activeSuggestionIndex].id);
    options[activeSuggestionIndex].scrollIntoView({ block: "nearest" });
}

async function loadPokemonIndex() {
    try {
        const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=2000");
        if (!response.ok) throw new Error("Could not load PokÃ©mons");

        const data = await response.json();
        allPokemons = data.results.map((pokemon) => {
            const id = Number(pokemon.url.split("/").filter(Boolean).at(-1));
            return { name: pokemon.name, id, types: [] };
        });

        try {
            const typeResponse = await fetch("https://pokeapi.co/api/v2/type?limit=100");
            if (typeResponse.ok) {
                const typeData = await typeResponse.json();
                const typeResults = await Promise.all(typeData.results.map(async ({ name, url }) => {
                    const response = await fetch(url);
                    if (!response.ok) return null;
                    const typeDetails = await response.json();
                    return { name, pokemon: typeDetails.pokemon.map(({ pokemon }) => pokemon.name) };
                }));
                const typesByName = new Map();
                typeResults.filter(Boolean).forEach(({ name, pokemon }) => {
                    pokemon.forEach((pokemonName) => {
                        if (!typesByName.has(pokemonName)) typesByName.set(pokemonName, []);
                        typesByName.get(pokemonName).push(name);
                    });
                });
                allPokemons.forEach((pokemon) => { pokemon.types = typesByName.get(pokemon.name) || []; });
                pokemonTypesLoaded = true;
            }
        } catch (error) {
            console.error("Could not load Pokémon types", error);
        }

        applyFilters();
    } catch (error) {
        console.error(error);
        notFoundMessage.classList.add("hidden");
        pokemonCardsContainer.innerHTML = `
            <div role="alert" class="col-span-full my-10 mx-auto w-full max-w-xl rounded-3xl border border-red-200 bg-white px-6 py-10 text-center shadow-sm sm:px-12">
                <div class="mx-auto mb-6 flex h-44 w-44 items-center justify-center rounded-full bg-linear-to-b from-slate-50 to-blue-100/80 ring-8 ring-blue-50/60 sm:h-48 sm:w-48">
                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/201.png" alt="Unown" class="h-40 w-40 object-contain drop-shadow-md sm:h-44 sm:w-44" />
                </div>
                <span class="mb-3 inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-red-700 ring-1 ring-inset ring-red-600/20">Connection problem</span>
                <h2 class="mb-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Pokémon couldn't be loaded</h2>
                <p class="mx-auto mb-6 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">We couldn't reach the Pokédex right now. Check your connection and try again.</p>
                <button type="button" class="rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2" onclick="loadPokemonIndex()">Try again</button>
            </div>`;
    }
}

async function displayPokemons(pokemons) {
    const requestId = ++searchRequest;
    pokemonCardsContainer.innerHTML = "";
    notFoundMessage.classList.toggle("hidden", pokemons.length > 0);
    if (!pokemons.length) return;

    const details = await Promise.all(pokemons.map(async (pokemon) => {
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.id}`);
            if (!response.ok) throw new Error(`Could not fetch Pokemon ${pokemon.id}`);
            return await response.json();
        } catch (error) {
            console.error(error);
            return null;
        }
    }));

    if (requestId !== searchRequest) return;
    pokemonCardsContainer.innerHTML = details.filter(Boolean).map((pokemon) => {
        const artwork = pokemon.sprites.other?.["official-artwork"]?.front_default;
        const sprite = pokemon.sprites.front_default;
        const image = artwork || sprite;
        const typeBadges = pokemon.types.map(({ type }) => `
            <span class="rounded-xl px-2 py-1 text-[0.55rem] md:text-xs font-semibold capitalize text-white ${typeColors[type.name] || "bg-slate-500"}">${type.name}</span>
        `).join("");
        return `
        <a href="#" class="group relative block min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg focus:-translate-y-1 focus:border-red-200 focus:shadow-lg">
        <span class="absolute right-0 top-0 z-10 rounded-bl-2xl bg-rose-700 px-2.5 py-1.5 font-mono text-xs font-semibold tracking-wide text-white sm:px-3 sm:py-2 sm:text-sm">#${pokemon.id}</span>
            <img src="${image || ""}" data-fallback-src="${sprite || ""}" alt="${pokemon.name}" class="h-28 w-full object-contain p-2 transition-transform duration-300 ease-out group-hover:scale-105 group-focus:scale-105 sm:h-40 md:h-52" onerror="if (this.dataset.fallbackSrc && this.src !== this.dataset.fallbackSrc) { this.src = this.dataset.fallbackSrc; } else { this.onerror = null; this.style.display = 'none'; }" />
        <div class="px-2 pb-3 pt-1 sm:px-4 sm:pb-4">
            <div class="mb-2 flex min-h-5 flex-wrap justify-center gap-1 sm:justify-start">${typeBadges}</div>
            <h2 class="truncate text-center text-sm font-semibold text-slate-900 capitalize sm:text-lg md:text-xl">${pokemon.name}</h2>
        </div>
        </a>

    `;
    }).join("");
    notFoundMessage.classList.toggle("hidden", details.some(Boolean));
}

function handleSearch() {
    applyFilters();
}

function applyFilters(loadMore = false) {
    if (!allPokemons.length) return;
    if (loadMore) visiblePokemonCount += pokemonBatchSize;
    else visiblePokemonCount = pokemonBatchSize;
    const searchTerm = searchInput.value.trim().toLowerCase().replace(/^#\s*/, "");
    const sortOrder = selectedSort;
    let matches = allPokemons.filter((pokemon) => {
        const matchesSearch = !searchTerm || pokemon.name.startsWith(searchTerm) || String(pokemon.id).startsWith(searchTerm);
        const matchesType = !selectedType || !pokemonTypesLoaded || pokemon.types.includes(selectedType);
        return matchesSearch && matchesType;
    });
    matches.sort((a, b) => {
        if (sortOrder === "name") return a.name.localeCompare(b.name);
        if (sortOrder === "name-desc") return b.name.localeCompare(a.name);
        return sortOrder === "number-desc" ? b.id - a.id : a.id - b.id;
    });
    const visibleMatches = matches.slice(0, visiblePokemonCount);
    loadMoreButton.classList.toggle("hidden", matches.length <= visibleMatches.length);
    displayPokemons(visibleMatches);
}

loadMoreButton.addEventListener("click", () => applyFilters(true));

searchInput.addEventListener("input", () => {
    clearSearchButton.classList.toggle("hidden", searchInput.value.length === 0);
    updateSuggestions();
    handleSearch();
});
clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchButton.classList.add("hidden");
    closeSuggestions();
    handleSearch();
    searchInput.focus();
});
function setupDropdown(root, button, list, label, onSelect) {
    const close = () => {
        list.classList.add("hidden");
        button.setAttribute("aria-expanded", "false");
    };
    const open = (focusFirst = false) => {
        list.classList.remove("hidden");
        button.setAttribute("aria-expanded", "true");
        if (focusFirst) list.querySelector('[role="option"]').focus();
    };

    button.addEventListener("click", () => {
        if (list.classList.contains("hidden")) open();
        else close();
    });
    button.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            open(true);
        } else if (event.key === "Escape") close();
    });
    list.addEventListener("click", (event) => {
        const option = event.target.closest('[role="option"]');
        if (!option) return;
        list.querySelectorAll('[role="option"]').forEach((item) => {
            item.setAttribute("aria-selected", String(item === option));
            item.tabIndex = -1;
        });
        label.textContent = option.textContent.trim();
        onSelect(option.dataset.value);
        close();
        button.focus();
    });
    list.addEventListener("keydown", (event) => {
        const options = [...list.querySelectorAll('[role="option"]')];
        const currentIndex = options.indexOf(document.activeElement);
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const direction = event.key === "ArrowDown" ? 1 : -1;
            options[(currentIndex + direction + options.length) % options.length].focus();
        } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            document.activeElement.click();
        } else if (event.key === "Escape") {
            close();
            button.focus();
        } else if (event.key === "Tab") close();
    });
    list.querySelectorAll('[role="option"]').forEach((option) => {
        option.tabIndex = -1;
        option.classList.add("focus:bg-slate-100", "focus:outline-none");
    });
    return { root, close };
}

const typeDropdown = setupDropdown(
    select('[data-dropdown="type"]'), typeFilterButton, typeFilterOptions, select("#typeFilterLabel"),
    (value) => { selectedType = value; applyFilters(); }
);
const sortDropdown = setupDropdown(
    select('[data-dropdown="sort"]'), sortPokemonsButton, sortPokemonsOptions, select("#sortPokemonsLabel"),
    (value) => { selectedSort = value; applyFilters(); }
);
document.addEventListener("click", (event) => {
    [typeDropdown, sortDropdown].forEach(({ root, close }) => {
        if (!root.contains(event.target)) close();
    });
});
suggestionsList.addEventListener("mousedown", (event) => {
    const option = event.target.closest('[role="option"]');
    if (option) {
        event.preventDefault();
        chooseSuggestion(option.dataset.name);
    }
});
searchInput.addEventListener("blur", () => setTimeout(closeSuggestions, 120));
searchButton.addEventListener("click", handleSearch);
searchInput.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" && !suggestionsList.classList.contains("hidden")) {
        event.preventDefault();
        setActiveSuggestion(activeSuggestionIndex + 1);
    } else if (event.key === "ArrowUp" && !suggestionsList.classList.contains("hidden")) {
        event.preventDefault();
        setActiveSuggestion(activeSuggestionIndex - 1);
    } else if (event.key === "Enter") {
        const active = suggestionsList.querySelector('[aria-selected="true"]');
        if (active && !suggestionsList.classList.contains("hidden")) {
            event.preventDefault();
            chooseSuggestion(active.dataset.name);
        } else {
            closeSuggestions();
            handleSearch();
        }
    } else if (event.key === "Escape") {
        closeSuggestions();
    }
});

loadPokemonIndex();

// Mobile navigation
function setMenuOpen(open) {
    navLinks.classList.toggle("max-h-0", !open);
    navLinks.classList.toggle("max-h-60", open);
    navLinks.classList.toggle("opacity-0", !open);
    navLinks.classList.toggle("opacity-100", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    select("#menuIcon i").classList.toggle("fa-bars", !open);
    select("#menuIcon i").classList.toggle("fa-xmark", open);
}

menuButton.addEventListener("click", () => {
    setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
});
document.addEventListener("click", (event) => {
    if (menuButton.getAttribute("aria-expanded") === "true" &&
        !navLinks.contains(event.target) && !menuButton.contains(event.target)) {
        setMenuOpen(false);
    }
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") setMenuOpen(false);
});
selectall("#navLinks li").forEach((link) => {
    link.addEventListener("click", () => {
        setMenuOpen(false);
    });
});
