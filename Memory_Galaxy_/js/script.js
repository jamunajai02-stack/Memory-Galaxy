
const USERS_KEY = "memoryGalaxyUsers";
const SESSION_KEY = "memoryGalaxySession";
const MEMORIES_KEY = "memoryGalaxyMemories";

let selectedPhotos = [];
let currentMemoryId = null;

function getData(key, fallback = []) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
    } catch {
        return fallback;
    }
}

function setMessage(id, text) {
    document.getElementById(id).textContent = text;
}

function showPage(pageId) {
    const protectedPages = ["galaxyPage"];

    // Never open the galaxy without a simulated login session.
    if (protectedPages.includes(pageId) && !getData(SESSION_KEY, null)) {
        pageId = "loginPage";
    }

    document.querySelectorAll(".screen").forEach(page => {
        page.classList.add("hidden");
    });

    document.getElementById(pageId).classList.remove("hidden");

    if (pageId === "galaxyPage") {
        renderMemories();
    }
}

function getCurrentUser() {
    return getData(SESSION_KEY, null);
}

// Registration
document.getElementById("registerForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const password = document.getElementById("registerPassword").value;

    const users = getData(USERS_KEY);

    if (users.some(user => user.email === email)) {
        setMessage("registerMessage", "An account already exists. Please log in.");
        return;
    }

    // DEMO ONLY: never store plaintext passwords in a real application.
    users.push({
        id: crypto.randomUUID(),
        name,
        email,
        password
    });

    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    event.target.reset();
    setMessage("registerMessage", "");
    document.getElementById("loginEmail").value = email;
    showPage("loginPage");
    setMessage("loginMessage", "Account created! Please log in.");
});

// Login
document.getElementById("loginForm").addEventListener("submit", event => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    const users = getData(USERS_KEY);
    const user = users.find(item =>
        item.email === email && item.password === password
    );

    if (!user) {
        setMessage("loginMessage", "Invalid email or password.");
        return;
    }

    // Demo session only; production must use server-verified authentication.
    localStorage.setItem(SESSION_KEY, JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email
    }));

    event.target.reset();
    setMessage("loginMessage", "");
    document.getElementById("userGreeting").textContent =
        `Explorer ${user.name}`;

    showPage("galaxyPage");
});

// Log out
function logout() {
    localStorage.removeItem(SESSION_KEY);
    selectedPhotos = [];
    closeMemoryForm();
    closeMemoryModal();
    showPage("welcomePage");
}

// Memory form
function openMemoryForm() {
    document.getElementById("memoryFormContainer").classList.remove("hidden");
    document.getElementById("memoryDate").value =
        new Date().toISOString().slice(0, 10);

    document.getElementById("memoryFormContainer").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function closeMemoryForm() {
    document.getElementById("memoryFormContainer").classList.add("hidden");
}

document.getElementById("memoryPhotos").addEventListener("change", event => {
    const files = Array.from(event.target.files);
    const preview = document.getElementById("photoPreview");

    selectedPhotos = [];
    preview.replaceChildren();

    files.forEach(file => {
        if (!file.type.startsWith("image/")) return;

        const reader = new FileReader();

        reader.onload = () => {
            selectedPhotos.push({
                name: file.name,
                data: reader.result
            });

            const image = document.createElement("img");
            image.src = reader.result;
            image.alt = file.name;
            preview.appendChild(image);
        };

        reader.readAsDataURL(file);
    });
});

// Save a memory
document.getElementById("memoryForm").addEventListener("submit", event => {
    event.preventDefault();

    const user = getCurrentUser();

    if (!user) {
        showPage("loginPage");
        return;
    }

    const memory = {
        id: crypto.randomUUID(),
        userId: user.id,
        title: document.getElementById("memoryTitle").value.trim(),
        date: document.getElementById("memoryDate").value,
        category: document.getElementById("memoryCategory").value,
        text: document.getElementById("memoryText").value,
        photos: [...selectedPhotos],
        createdAt: new Date().toISOString()
    };

    const memories = getData(MEMORIES_KEY);
    memories.push(memory);

    try {
        localStorage.setItem(MEMORIES_KEY, JSON.stringify(memories));
    } catch (error) {
        setMessage(
            "memoryMessage",
            "Browser storage is full. Use fewer or smaller photos for this demo."
        );
        return;
    }

    event.target.reset();
    selectedPhotos = [];
    document.getElementById("photoPreview").replaceChildren();
    closeMemoryForm();
    renderMemories();
});

// Render only the current user's memories
function renderMemories() {
    const user = getCurrentUser();
    const grid = document.getElementById("memoryGrid");
    const emptyMessage = document.getElementById("emptyMessage");

    grid.replaceChildren();

    if (!user) return;

    const memories = getData(MEMORIES_KEY)
        .filter(memory => memory.userId === user.id);

    document.getElementById("memoryCount").textContent =
        `${memories.length} ${memories.length === 1 ? "memory" : "memories"}`;

    emptyMessage.classList.toggle("hidden", memories.length > 0);

    memories.slice().reverse().forEach(memory => {
        const card = document.createElement("article");
        card.className = "memory-card";
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `Open memory: ${memory.title}`);

        const star = document.createElement("span");
        star.className = "memory-star";
        star.textContent = "✦";

        const title = document.createElement("h3");
        title.textContent = memory.title;

        const date = document.createElement("p");
        date.textContent = `${memory.date} · ${memory.category}`;

        const description = document.createElement("p");
        description.textContent = memory.text.slice(0, 100) +
            (memory.text.length > 100 ? "…" : "");

        card.append(star, title, date, description);

        if (memory.photos.length > 0) {
            const image = document.createElement("img");
            image.className = "memory-thumb";
            image.src = memory.photos[0].data;
            image.alt = memory.photos[0].name;
            card.appendChild(image);
        }

        card.addEventListener("click", () => openMemory(memory.id));
        card.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openMemory(memory.id);
            }
        });

        grid.appendChild(card);
    });
}

// Open one memory
function openMemory(memoryId) {
    const user = getCurrentUser();

    if (!user) {
        showPage("loginPage");
        return;
    }

    const memory = getData(MEMORIES_KEY).find(item =>
        item.id === memoryId && item.userId === user.id
    );

    if (!memory) return;

    currentMemoryId = memory.id;

    const details = document.getElementById("memoryDetails");
    details.replaceChildren();

    const star = document.createElement("div");
    star.className = "memory-star";
    star.textContent = "✦";

    const title = document.createElement("h2");
    title.textContent = memory.title;

    const date = document.createElement("p");
    date.className = "muted";
    date.textContent = `${memory.date} · ${memory.category}`;

    const story = document.createElement("p");
    story.style.whiteSpace = "pre-wrap";
    story.textContent = memory.text || "No written memory.";

    const photos = document.createElement("div");
    photos.className = "modal-photos";

    memory.photos.forEach(photo => {
        const image = document.createElement("img");
        image.src = photo.data;
        image.alt = photo.name;
        photos.appendChild(image);
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete this memory";
    deleteButton.addEventListener("click", deleteCurrentMemory);

    details.append(star, title, date, story, photos, deleteButton);

    document.getElementById("memoryModal").classList.remove("hidden");
}

function closeMemoryModal() {
    document.getElementById("memoryModal").classList.add("hidden");
    currentMemoryId = null;
}

function deleteCurrentMemory() {
    const user = getCurrentUser();

    if (!user || !currentMemoryId) return;

    if (!confirm("Are you sure you want to delete this memory?")) return;

    const memories = getData(MEMORIES_KEY).filter(memory =>
        !(memory.id === currentMemoryId && memory.userId === user.id)
    );

    localStorage.setItem(MEMORIES_KEY, JSON.stringify(memories));

    closeMemoryModal();
    renderMemories();
}

// Animated background stars
function createBackgroundStars() {
    const container = document.getElementById("starsBackground");
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < 120; i++) {
        const star = document.createElement("span");
        star.className = "bg-star";
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.setProperty("--duration", `${1.5 + Math.random() * 4}s`);
        star.style.animationDelay = `${Math.random() * 3}s`;
        fragment.appendChild(star);
    }

    container.appendChild(fragment);
}

// Close the memory viewer by clicking outside it
document.getElementById("memoryModal").addEventListener("click", event => {
    if (event.target.id === "memoryModal") {
        closeMemoryModal();
    }
});

// Restore an existing demo session after refreshing the page
function initializeApp() {
    createBackgroundStars();

    const user = getCurrentUser();

    if (user) {
        document.getElementById("userGreeting").textContent =
            `Explorer ${user.name}`;
        showPage("galaxyPage");
    } else {
        showPage("welcomePage");
    }
}

initializeApp();
