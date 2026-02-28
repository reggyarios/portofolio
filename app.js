import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Kredensial Supabase
const supabaseUrl = 'https://qbsocuxntxoegtxxfwtf.supabase.co';
const supabaseKey = 'sb_publishable_vUy66yFNPZWQtaD5FOSKKA_xKcgqLzy';
const supabase = createClient(supabaseUrl, supabaseKey);

const currentPath = window.location.pathname;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inisialisasi Fitur Toggle Theme (Berlaku di semua halaman)
    initThemeToggle();

    // 2. Inisialisasi Modal Profile (Jika ada di halaman tersebut)
    initProfileModal();

    // 3. Routing Logic
    if (currentPath.includes('access.html')) {
        initAdmin();
    } else if (currentPath.includes('detail.html')) {
        initDetail();
    } else {
        initHome();
    }
});

// ==========================================
// LOGIC THEME TOGGLE (DARK / LIGHT)
// ==========================================
function initThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (!themeToggleBtn) return;

    themeToggleBtn.addEventListener('click', () => {
        const htmlElement = document.documentElement;
        if (htmlElement.classList.contains('dark')) {
            htmlElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            htmlElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
    });
}

// ==========================================
// LOGIC PROFILE MODAL
// ==========================================
function initProfileModal() {
    const profileBtn = document.getElementById('profile-btn');
    const profileModal = document.getElementById('profile-modal');
    const closeModal = document.getElementById('close-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalContent = document.getElementById('modal-content');

    // Pastikan elemen ada di halaman ini sebelum menambahkan event
    if (!profileBtn || !profileModal) return;

    function openProfile() {
        profileModal.classList.remove('opacity-0', 'pointer-events-none');
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    }

    function closeProfile() {
        profileModal.classList.add('opacity-0', 'pointer-events-none');
        modalContent.classList.remove('scale-100');
        modalContent.classList.add('scale-95');
    }

    profileBtn.addEventListener('click', openProfile);
    closeModal.addEventListener('click', closeProfile);
    modalBackdrop.addEventListener('click', closeProfile);
}

// ==========================================
// LOGIC HALAMAN UTAMA (INDEX.HTML)
// ==========================================
// ==========================================
// LOGIC HALAMAN UTAMA (INDEX.HTML)
// ==========================================
async function initHome() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    const { data: projects, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    
    if (error) {
        container.innerHTML = `<p class="text-red-500">Error loading projects.</p>`;
        return;
    }

    if (projects.length === 0) {
        container.innerHTML = `<p class="text-neutral-500 font-light">No projects found. Add some from the admin panel!</p>`;
        return;
    }

    container.innerHTML = ''; 
    
    projects.forEach(proj => {
        const techs = proj.tech_stack.split(',').map(t => t.trim());
        let techHTML = techs.map(t => `<span class="border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 px-3 py-1 text-[10px] uppercase tracking-widest rounded-none">${t}</span>`).join('');

        // Card dengan Gambar Full Width (100%), Height lebih pendek (aspect-video), dan efek klik
        const card = `
            <a href="/detail.html?id=${proj.id}" class="group flex flex-col bg-white dark:bg-[#0a0a0a] rounded-none overflow-hidden transition-all duration-500 ease-out hover:-translate-y-4 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_20px_50px_-10px_rgba(255,255,255,0.25)] active:scale-[0.98] active:translate-y-0 active:shadow-none cursor-pointer relative z-10 hover:z-20 border border-transparent dark:border-neutral-900 hover:border-neutral-100 dark:hover:border-neutral-800">
                
                <div class="relative w-full aspect-video overflow-hidden bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-900 flex-shrink-0">
                    <img src="${proj.image_url}" alt="${proj.title}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-out group-hover:scale-105" loading="lazy">
                </div>
                
                <div class="p-6 md:p-8 flex flex-col flex-grow justify-between">
                    <div>
                        <h3 class="text-2xl font-bold tracking-tight mb-2 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">${proj.title}</h3>
                        <p class="text-neutral-600 dark:text-neutral-400 text-sm mb-6 leading-relaxed font-light line-clamp-2">${proj.description}</p>
                    </div>
                    <div class="flex flex-wrap gap-2 mt-auto">
                        ${techHTML}
                    </div>
                </div>
            </a>
        `;
        container.innerHTML += card;
    });
}

// ==========================================
// LOGIC HALAMAN DETAIL (DETAIL.HTML)
// ==========================================
async function initDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    if (!projectId) {
        window.location.href = '/index.html';
        return;
    }

    const { data: proj, error } = await supabase.from('projects').select('*').eq('id', projectId).single();
    const container = document.getElementById('project-detail-container');

    if (error || !proj) {
        container.innerHTML = `<h1 class="text-center text-red-500 mt-20">Project not found.</h1>`;
        return;
    }
    
    const techs = proj.tech_stack.split(',').map(t => t.trim());
    let techHTML = techs.map(t => `<span class="border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 px-3 py-1 text-[10px] uppercase tracking-widest">${t}</span>`).join('');

    let actionButtonHTML = '';
    if (proj.demo_url && proj.demo_url.trim() !== '') {
        actionButtonHTML = `
        <div id="action-button-container" class="pt-10 border-t border-neutral-200 dark:border-neutral-800">
            <a href="${proj.demo_url}" target="_blank" class="inline-flex items-center justify-center bg-black text-white dark:bg-white dark:text-black font-semibold uppercase tracking-widest text-xs py-4 px-10 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors">
                Try Out / Visit Site
            </a>
        </div>`;
    }

    container.innerHTML = `
        <div class="w-full aspect-video bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 mb-12 flex items-center justify-center overflow-hidden">
             <img src="${proj.image_url}" alt="${proj.title}" class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500">
        </div>
        <div class="mb-12">
            <h1 class="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6">${proj.title}</h1>
            <div class="flex flex-wrap gap-2">${techHTML}</div>
        </div>
        <div class="prose prose-neutral dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-400 leading-relaxed font-light mb-16 text-lg whitespace-pre-wrap">${proj.description}</div>
        ${actionButtonHTML}
    `;
}

// ==========================================
// LOGIC HALAMAN ADMIN (ACCESS.HTML)
// ==========================================
async function initAdmin() {
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const addProjectForm = document.getElementById('add-project-form');

    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            loginScreen.style.display = 'none';
            dashboardScreen.style.display = 'block';
            loadAdminProjects();
        } else {
            loginScreen.style.display = 'flex';
            dashboardScreen.style.display = 'none';
        }
    };
    checkSession();

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = loginForm.querySelector('button');
        btn.textContent = 'Authenticating...';
        
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            alert('Login Gagal: ' + error.message);
            btn.textContent = 'Sign In';
        } else {
            btn.textContent = 'Sign In';
            checkSession();
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        checkSession();
    });

    addProjectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = addProjectForm.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Uploading...';
        submitBtn.disabled = true;

        const title = document.getElementById('proj-title').value;
        const tech_stack = document.getElementById('proj-tech').value;
        const demo_url = document.getElementById('proj-demo').value;
        const description = document.getElementById('proj-desc').value;
        
        const imageInput = document.getElementById('proj-image');
        if (!imageInput.files || imageInput.files.length === 0) {
            alert('Tolong pilih gambar cover terlebih dahulu.');
            submitBtn.textContent = 'Save Project';
            submitBtn.disabled = false;
            return;
        }

        const imageFile = imageInput.files[0];
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`; 

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('portfolio-images')
            .upload(fileName, imageFile);

        if (uploadError) {
            alert('Gagal upload gambar: ' + uploadError.message);
            submitBtn.textContent = 'Save Project';
            submitBtn.disabled = false;
            return;
        }

        const { data: publicUrlData } = supabase.storage.from('portfolio-images').getPublicUrl(fileName);
        const imageUrl = publicUrlData.publicUrl;

        const { error: insertError } = await supabase.from('projects').insert([{
            title, description, image_url: imageUrl, tech_stack, demo_url
        }]);

        if (insertError) {
            alert('Gagal simpan data: ' + insertError.message);
        } else {
            alert('Project berhasil ditambahkan!');
            addProjectForm.reset();
            loadAdminProjects();
        }
        
        submitBtn.textContent = 'Save Project';
        submitBtn.disabled = false;
    });
}

async function loadAdminProjects() {
    const list = document.getElementById('projects-list');
    const { data: projects } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    
    list.innerHTML = '';
    if (!projects || projects.length === 0) {
        list.innerHTML = '<p class="text-neutral-500 font-light text-sm">Belum ada project.</p>';
        return;
    }

    projects.forEach(proj => {
        list.innerHTML += `
            <div class="border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-neutral-50 dark:bg-neutral-900/50 transition-colors hover:border-neutral-400 dark:hover:border-neutral-600">
                <div>
                    <h3 class="font-bold text-lg tracking-tight mb-1">${proj.title}</h3>
                    <p class="text-sm text-neutral-500 font-light truncate w-full max-w-md">${proj.description}</p>
                </div>
                <div class="flex gap-4">
                    <button onclick="deleteProject(${proj.id})" class="text-xs font-semibold tracking-widest uppercase text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">Delete</button>
                </div>
            </div>
        `;
    });
}

window.deleteProject = async function(id) {
    if(confirm('Yakin ingin menghapus project ini?')) {
        await supabase.from('projects').delete().eq('id', id);
        if(window.location.pathname.includes('access.html')) {
            initAdmin(); 
        }
    }
}