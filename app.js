import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Kredensial Supabase
const supabaseUrl = 'https://qbsocuxntxoegtxxfwtf.supabase.co';
const supabaseKey = 'sb_publishable_vUy66yFNPZWQtaD5FOSKKA_xKcgqLzy';
const supabase = createClient(supabaseUrl, supabaseKey);

const currentPath = window.location.pathname;

document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initProfileModal();

    if (currentPath.includes('access.html')) {
        initAdmin();
    } else if (currentPath.includes('detail.html')) {
        initDetail();
    } else {
        initHome();
    }
});

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

function initProfileModal() {
    const profileBtn = document.getElementById('profile-btn');
    const profileModal = document.getElementById('profile-modal');
    const closeModal = document.getElementById('close-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalContent = document.getElementById('modal-content');

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
// LOGIC HALAMAN UTAMA (INDEX)
// ==========================================
async function initHome() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    const { data: projects, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    
    if (error || projects.length === 0) {
        container.innerHTML = `<p class="text-neutral-500 font-light">No projects found or error loading.</p>`;
        return;
    }

    container.innerHTML = ''; 
    
    projects.forEach(proj => {
        const techs = proj.tech_stack.split(',').map(t => t.trim());
        let techHTML = techs.map(t => `<span class="border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 px-3 py-1 text-[10px] uppercase tracking-widest rounded-none">${t}</span>`).join('');

        // Ambil gambar pertama sebagai cover (karena image_url sekarang bisa berisi banyak link)
        const coverMedia = proj.image_url.split(',')[0].trim();
        const isVideo = coverMedia.match(/\.(mp4|webm|ogg)$/i);
        
        let mediaTag = isVideo 
            ? `<video src="${coverMedia}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-out group-hover:scale-105" muted loop autoplay playsinline></video>`
            : `<img src="${coverMedia}" alt="${proj.title}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-out group-hover:scale-105" loading="lazy">`;

        const card = `
            <a href="/detail.html?id=${proj.id}" class="group flex flex-col bg-white dark:bg-[#0a0a0a] rounded-none overflow-hidden transition-all duration-500 ease-out hover:-translate-y-4 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_20px_50px_-10px_rgba(255,255,255,0.25)] active:scale-[0.98] active:translate-y-0 active:shadow-none cursor-pointer relative z-10 hover:z-20 border border-transparent dark:border-neutral-900 hover:border-neutral-100 dark:hover:border-neutral-800">
                <div class="relative w-full aspect-video overflow-hidden bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-900 flex-shrink-0">
                    ${mediaTag}
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
// LOGIC HALAMAN DETAIL (STEAM GALLERY)
// ==========================================
async function initDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    if (!projectId) return window.location.href = '/index.html';

    const { data: proj, error } = await supabase.from('projects').select('*').eq('id', projectId).single();
    const container = document.getElementById('project-detail-container');

    if (error || !proj) {
        container.innerHTML = `<h1 class="text-center text-red-500 mt-20">Project not found.</h1>`;
        return;
    }
    
    // Pecah array media
    const medias = proj.image_url.split(',').map(url => url.trim());
    const techs = proj.tech_stack.split(',').map(t => t.trim());
    let techHTML = techs.map(t => `<span class="border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 px-3 py-1 text-[10px] uppercase tracking-widest">${t}</span>`).join('');

    const checkIsVideo = (url) => url.match(/\.(mp4|webm|ogg)$/i);

    const renderMediaTag = (url, classes) => {
        if (checkIsVideo(url)) {
            return `<video src="${url}" class="${classes}" controls autoplay muted loop playsinline></video>`;
        }
        return `<img src="${url}" alt="Project Media" class="${classes}">`;
    };

    // Buat HTML Thumbnails
    let thumbnailsHTML = '';
    if (medias.length > 1) {
        thumbnailsHTML = `<div class="flex gap-4 mt-4 overflow-x-auto pb-4 scrollbar-hide">`;
        medias.forEach((media, index) => {
            let thumbContent = checkIsVideo(media) 
                ? `<video src="${media}" class="w-full h-full object-cover pointer-events-none"></video><div class="absolute inset-0 flex items-center justify-center bg-black/30"><svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4l12 6-12 6z"/></svg></div>`
                : `<img src="${media}" class="w-full h-full object-cover">`;
            
            thumbnailsHTML += `
                <div class="gallery-thumb relative w-32 aspect-video bg-neutral-200 dark:bg-neutral-800 cursor-pointer border-2 transition-all duration-300 ${index === 0 ? 'border-black dark:border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-100'} flex-shrink-0" data-url="${media}">
                    ${thumbContent}
                </div>
            `;
        });
        thumbnailsHTML += `</div>`;
    }

    let actionButtonHTML = '';
    if (proj.demo_url && proj.demo_url.trim() !== '') {
        actionButtonHTML = `
        <div class="pt-10 border-t border-neutral-200 dark:border-neutral-800">
            <a href="${proj.demo_url}" target="_blank" class="inline-flex items-center justify-center bg-black text-white dark:bg-white dark:text-black font-semibold uppercase tracking-widest text-xs py-4 px-10 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors">
                Try Out / Visit Site
            </a>
        </div>`;
    }

    // Urutan: Judul -> Tag -> Main Media -> Thumbnails -> Deskripsi -> Tombol
    container.innerHTML = `
        <div class="mb-10">
            <h1 class="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6">${proj.title}</h1>
            <div class="flex flex-wrap gap-2">${techHTML}</div>
        </div>
        
        <div class="mb-12">
            <div id="main-media-container" class="w-full aspect-video bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center overflow-hidden">
                 ${renderMediaTag(medias[0], 'w-full h-full object-cover')}
            </div>
            ${thumbnailsHTML}
        </div>

        <div class="prose prose-neutral dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-400 leading-relaxed font-light mb-16 text-lg whitespace-pre-wrap">${proj.description}</div>
        
        ${actionButtonHTML}
    `;

    // Logic Interaktif Gallery Steam
    if (medias.length > 1) {
        const mainContainer = document.getElementById('main-media-container');
        const thumbs = document.querySelectorAll('.gallery-thumb');
        
        thumbs.forEach(thumb => {
            thumb.addEventListener('click', function() {
                // Update Main Media
                const url = this.getAttribute('data-url');
                mainContainer.innerHTML = renderMediaTag(url, 'w-full h-full object-contain bg-black'); // object-contain agar video utuh

                // Update Style Thumbnails (Garis Tepi & Opacity)
                thumbs.forEach(t => {
                    t.classList.remove('border-black', 'dark:border-white', 'opacity-100');
                    t.classList.add('border-transparent', 'opacity-50');
                });
                this.classList.remove('border-transparent', 'opacity-50');
                this.classList.add('border-black', 'dark:border-white', 'opacity-100');
            });
        });
    }
}

// ==========================================
// LOGIC HALAMAN ADMIN (FULL CRUD)
// ==========================================
let editingProjectId = null; // Menyimpan ID jika sedang mode Edit
let existingMediaUrls = ""; // Menyimpan URL lama jika tidak upload foto baru saat edit

async function initAdmin() {
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const addProjectForm = document.getElementById('add-project-form');
    
    // Elemen Form untuk Edit
    const formTitle = document.getElementById('form-title');
    const submitBtn = document.getElementById('submit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');

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
        if (error) alert('Login Gagal: ' + error.message);
        btn.textContent = 'Sign In';
        checkSession();
    });

    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        checkSession();
    });

    // Handle Cancel Edit
    if(cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            editingProjectId = null;
            existingMediaUrls = "";
            addProjectForm.reset();
            formTitle.textContent = "Add New Project";
            submitBtn.textContent = "Save Project";
            cancelEditBtn.classList.add('hidden');
        });
    }

    addProjectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Uploading & Saving...';
        submitBtn.disabled = true;

        const title = document.getElementById('proj-title').value;
        const tech_stack = document.getElementById('proj-tech').value;
        const demo_url = document.getElementById('proj-demo').value;
        const description = document.getElementById('proj-desc').value;
        const imageInput = document.getElementById('proj-image');
        
        let finalMediaUrlString = existingMediaUrls; // Default ke media lama (jika ada)

        // Jika ada file baru yang diupload (berlaku untuk Insert Baru atau Edit Replace)
        if (imageInput.files && imageInput.files.length > 0) {
            let uploadedUrls = [];
            for (let file of imageInput.files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${fileExt}`; 

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('portfolio-images')
                    .upload(fileName, file);

                if (!uploadError) {
                    const { data: publicUrlData } = supabase.storage.from('portfolio-images').getPublicUrl(fileName);
                    uploadedUrls.push(publicUrlData.publicUrl);
                }
            }
            if (uploadedUrls.length > 0) {
                finalMediaUrlString = uploadedUrls.join(','); // Gabungkan dengan koma
            }
        } else if (!editingProjectId) {
            alert('Tolong pilih minimal 1 gambar/video preview.');
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
            return;
        }

        if (editingProjectId) {
            // Proses UPDATE
            const { error: updateError } = await supabase.from('projects')
                .update({ title, description, image_url: finalMediaUrlString, tech_stack, demo_url })
                .eq('id', editingProjectId);
                
            if (updateError) alert('Gagal Update: ' + updateError.message);
            else alert('Project berhasil diperbarui!');
        } else {
            // Proses INSERT
            const { error: insertError } = await supabase.from('projects').insert([{
                title, description, image_url: finalMediaUrlString, tech_stack, demo_url
            }]);
            
            if (insertError) alert('Gagal Simpan: ' + insertError.message);
            else alert('Project berhasil ditambahkan!');
        }
        
        // Reset Form & State
        addProjectForm.reset();
        editingProjectId = null;
        existingMediaUrls = "";
        if(formTitle) formTitle.textContent = "Add New Project";
        if(cancelEditBtn) cancelEditBtn.classList.add('hidden');
        submitBtn.textContent = "Save Project";
        submitBtn.disabled = false;
        
        loadAdminProjects();
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
                    <button onclick="editProject(${proj.id})" class="text-xs font-semibold tracking-widest uppercase text-blue-500 hover:text-blue-700 transition-colors">Edit</button>
                    <button onclick="deleteProject(${proj.id})" class="text-xs font-semibold tracking-widest uppercase text-red-500 hover:text-red-700 transition-colors">Delete</button>
                </div>
            </div>
        `;
    });
}

// Global Edit Function
window.editProject = async function(id) {
    const { data: proj, error } = await supabase.from('projects').select('*').eq('id', id).single();
    if(error) return alert("Gagal mengambil data project.");

    document.getElementById('proj-title').value = proj.title;
    document.getElementById('proj-tech').value = proj.tech_stack;
    document.getElementById('proj-demo').value = proj.demo_url || '';
    document.getElementById('proj-desc').value = proj.description;
    
    // Set status editing
    editingProjectId = proj.id;
    existingMediaUrls = proj.image_url; // Simpan URL lama

    // Ubah UI Form
    const formTitle = document.getElementById('form-title');
    const submitBtn = document.getElementById('submit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    
    if(formTitle) formTitle.textContent = "Edit Project: " + proj.title;
    if(submitBtn) submitBtn.textContent = "Update Project";
    if(cancelEditBtn) cancelEditBtn.classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll ke atas
}

window.deleteProject = async function(id) {
    if(confirm('Yakin ingin menghapus project ini?')) {
        await supabase.from('projects').delete().eq('id', id);
        if(window.location.pathname.includes('access.html')) {
            initAdmin(); 
        }
    }
}