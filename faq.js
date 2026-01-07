const sidebar = document.getElementById("categoryList");
const faqContent = document.getElementById("faqContent");

let categories = [];
let faqs = [];

// Ambil data kategori dari server
async function loadCategories() {
    const res = await fetch("/categories");
    categories = await res.json();
    renderSidebar();
}

// Ambil data FAQ dari server
async function loadFaq() {
    const res = await fetch("/faq");
    faqs = await res.json();
}

// Render sidebar kategori + pertanyaan
function renderSidebar() {
    sidebar.innerHTML = "";

    categories.forEach(cat => {
        const li = document.createElement("li");
        li.textContent = cat.name;
        li.dataset.catId = cat.id;

        const ul = document.createElement("ul");

        faqs.filter(f => f.category_id === cat.id)
            .forEach(f => {
                const liFaq = document.createElement("li");
                liFaq.textContent = f.question;
                liFaq.addEventListener("click", e => {
                    e.stopPropagation();
                    showFaqDetail(f);
                });
                ul.appendChild(liFaq);
            });

        li.appendChild(ul);

        // toggle pertanyaan
        li.addEventListener("click", () => {
            const sublist = li.querySelector("ul");
            if (sublist) sublist.style.display = sublist.style.display === "block" ? "none" : "block";
        });

        sidebar.appendChild(li);
    });
}

// Tampilkan FAQ di main
function showFaqDetail(faq) {
    faqContent.innerHTML = `
        <div class="faq-card">
            <h3>${faq.question}</h3>
            <p>${faq.answer}</p>
        </div>
    `;
}

function getCategoryName(category_id) {
    const cat = categories.find(c => c.id === category_id);
    return cat ? cat.name : "Umum";
}

// Inisialisasi
async function initFAQ() {
    await loadFaq();
    await loadCategories();
}

initFAQ();
