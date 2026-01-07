document.addEventListener("DOMContentLoaded", () => {

    /************** NAVIGASI **************/
    const sidebarToggle = document.querySelector(".sidebar-toggle");
    const sidebarMenuItems = document.querySelectorAll(".sidebar-menu li");
    const sections = document.querySelectorAll(".section");
    const logoutBtn = document.getElementById("logoutBtn");

    function showSection(id, el) {
        sections.forEach(sec => sec.classList.remove("active"));
        sidebarMenuItems.forEach(li => li.classList.remove("active"));

        const section = document.getElementById(id);
        if (section) section.classList.add("active");
        el.classList.add("active");
    }

    sidebarMenuItems.forEach(li => {
        li.addEventListener("click", () => {
            const sectionId = li.dataset.section;
            showSection(sectionId, li);
        });
    });

    sidebarToggle.addEventListener("click", () => {
        document.getElementById("sidebar").classList.toggle("closed");
    });

    logoutBtn.addEventListener("click", () => {
        window.location.href = "/logout";
    });

    /************** KATEGORI **************/
    let editCategoryId = null;

    async function loadCategoryOptions() {
        const res = await fetch("/categories");
        const categories = await res.json();
        const select = document.getElementById("faqCategory");
        if (!select) return;
        select.innerHTML = "<option value=''>Pilih Kategori</option>";
        categories.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });
        return categories; // kembalikan data kategori
    }

    async function loadCategories() {
        const res = await fetch("/categories");
        const data = await res.json();
        const tbody = document.querySelector("#categoryTable tbody");
        tbody.innerHTML = "";

        data.forEach(cat => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${cat.id}</td>
                <td>${cat.name}</td>
                <td>
                    <button class="editCatBtn">Edit</button>
                    <button class="delCatBtn">Hapus</button>
                </td>`;
            tbody.appendChild(row);

            row.querySelector(".editCatBtn").addEventListener("click", () => {
                editCategoryId = cat.id;
                document.getElementById("editCategoryName").value = cat.name;
                document.getElementById("editCategoryForm").style.display = "block";
            });

            row.querySelector(".delCatBtn").addEventListener("click", async () => {
                if (!confirm("Hapus kategori ini?")) return;
                await fetch(`/categories/${cat.id}`, { method: "DELETE" });
                await loadCategories();
                await loadFaq(); // update FAQ agar label kategori ikut update
            });
        });

        await loadCategoryOptions(); // tunggu dropdown kategori selesai
    }

    document.getElementById("addCategoryBtn").addEventListener("click", async () => {
        const name = document.getElementById("newCategoryName").value.trim();
        if (!name) return;
        await fetch("/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
        });
        document.getElementById("newCategoryName").value = "";
        await loadCategories();
        await loadFaq();
    });

    document.getElementById("saveEditCategoryBtn").addEventListener("click", async () => {
        const name = document.getElementById("editCategoryName").value.trim();
        if (!name || editCategoryId === null) return;

        await fetch(`/categories/${editCategoryId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
        });

        editCategoryId = null;
        document.getElementById("editCategoryForm").style.display = "none";

        await loadCategories();
        await loadFaq(); // agar FAQ update otomatis label kategori
    });

    document.getElementById("cancelEditCategoryBtn").addEventListener("click", () => {
        editCategoryId = null;
        document.getElementById("editCategoryForm").style.display = "none";
    });

    /************** FAQ **************/
    let faqs = [];
    let editIndex = null;

    async function loadFaq() {
        const res = await fetch("/faq");
        faqs = await res.json();
        renderFaq();
    }

function renderFaq() {
    const list = document.getElementById("faqList");
    if (!list) return;
    list.innerHTML = "";

    if (faqs.length === 0) {
        list.innerHTML = "<p>Belum ada FAQ.</p>";
        return;
    }

    faqs.forEach((item, i) => {
        const categoryName = item.category_id ? getCategoryName(item.category_id) : "-";

        const div = document.createElement("div");
        div.id = `faqItem${i}`;  // tambah ID unik
        div.innerHTML = `
            <b>${item.question}</b> <i>(${categoryName})</i><br>
            ${item.answer}<br>
            <button class="editFaqBtn">Edit</button>
            <button class="delFaqBtn">Hapus</button>
            <hr>
        `;
        list.appendChild(div);

        div.querySelector(".editFaqBtn").addEventListener("click", () => editFaq(i));
        div.querySelector(".delFaqBtn").addEventListener("click", () => deleteFaq(i));
    });
}


    function getCategoryName(id) {
        const select = document.getElementById("faqCategory");
        if (!select) return "-";
        const option = select.querySelector(`option[value='${id}']`);
        return option ? option.textContent : "-";
    }

    function saveFaq() {
        const q = document.getElementById("question").value.trim();
        const a = document.getElementById("answer").value.trim();
        const c = document.getElementById("faqCategory").value;

        if (!q || !a) {
            alert("Pertanyaan dan jawaban tidak boleh kosong");
            return;
        }

        if (editIndex === null) {
            faqs.push({ question: q, answer: a, category_id: parseInt(c) });
        } else {
            faqs[editIndex] = { question: q, answer: a, category_id: parseInt(c) };
            editIndex = null;
        }

        updateServer();
        document.getElementById("question").value = "";
        document.getElementById("answer").value = "";
        document.getElementById("faqCategory").value = "";
    }

function editFaq(i) {
    // Hapus form edit lama jika ada
    const existingForm = document.querySelector(".inlineEditForm");
    if (existingForm) existingForm.remove();

    const faqItemDiv = document.getElementById(`faqItem${i}`);
    if (!faqItemDiv) return;

    // Buat form edit inline
    const form = document.createElement("div");
    form.className = "inlineEditForm";
    form.innerHTML = `
        <input type="text" class="editQuestion" value="${faqs[i].question}">
        <textarea class="editAnswer">${faqs[i].answer}</textarea>
        <select class="editCategory">
            <option value="">Pilih Kategori</option>
        </select>
        <button class="saveInlineBtn">Simpan</button>
        <button class="cancelInlineBtn">Batal</button>
    `;

    // Tambahkan option kategori ke select
    const select = form.querySelector(".editCategory");
    const options = document.getElementById("faqCategory").innerHTML;
    select.innerHTML = options;
    select.value = faqs[i].category_id || "";

    // Event simpan
    form.querySelector(".saveInlineBtn").addEventListener("click", () => {
        const q = form.querySelector(".editQuestion").value.trim();
        const a = form.querySelector(".editAnswer").value.trim();
        const c = form.querySelector(".editCategory").value;

        if (!q || !a) { alert("Pertanyaan & jawaban tidak boleh kosong"); return; }

        faqs[i] = { question: q, answer: a, category_id: parseInt(c) };
        updateServer();
    });

    // Event batal
    form.querySelector(".cancelInlineBtn").addEventListener("click", () => {
        form.remove();
    });

    // Sisipkan form setelah div FAQ yang dipilih
    faqItemDiv.after(form);
}

    function deleteFaq(i) {
        if (confirm("Hapus FAQ ini?")) {
            faqs.splice(i, 1);
            updateServer();
        }
    }

    function updateServer() {
        fetch("/faq/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(faqs)
        }).then(loadFaq);
    }

    document.getElementById("saveFaqBtn").addEventListener("click", saveFaq);

    /************** INTENTS **************/
    function loadIntents() {
        fetch("/intents")
            .then(res => res.json())
            .then(data => {
                document.getElementById("intentsEditor").value = data.content;
            });
    }

    function saveIntents() {
        const content = document.getElementById("intentsEditor").value;
        try { JSON.parse(content); } catch { alert("JSON tidak valid"); return; }

        fetch("/intents/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content })
        }).then(res => res.json())
          .then(() => alert("Intents disimpan & AI dilatih ulang"));
    }

    document.getElementById("saveIntentsBtn").addEventListener("click", saveIntents);

    /************** LOAD DATA AWAL **************/
    loadCategories().then(loadFaq); // penting: loadFaq() **setelah kategori selesai dimuat**
    loadIntents();
});
