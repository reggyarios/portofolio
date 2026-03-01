import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Kredensial Supabase
const supabaseUrl = 'https://qbsocuxntxoegtxxfwtf.supabase.co';
const supabaseKey = 'sb_publishable_vUy66yFNPZWQtaD5FOSKKA_xKcgqLzy';
const supabase = createClient(supabaseUrl, supabaseKey);

const currentPath = window.location.pathname;

document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initProfileModal();
    initDynamicAccent();

    if (currentPath.includes('access.html')) {
        initAdmin();
    } else if (currentPath.includes('detail.html')) {
        initDetail();
    } else {
        initHome();
    }
});

// ==========================================
// LOGIC THEME TOGGLE
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
// LOGIC PROFILE MODAL (Flip Card, Tanpa Tombol X)
// ==========================================
function initProfileModal() {
    const profileBtn = document.getElementById('profile-btn');
    const profileModal = document.getElementById('profile-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalContent = document.getElementById('modal-content');
    const flipInner = document.getElementById('flip-inner'); // Wrapper yang berputar

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
        // Reset putaran ke depan saat ditutup
        setTimeout(() => flipInner.classList.remove('[transform:rotateY(180deg)]'), 300);
    }

    profileBtn.addEventListener('click', openProfile);
    modalBackdrop.addEventListener('click', closeProfile); 
    // Card akan berputar lewat onClick bawaan di HTML
}

// ==========================================
// LOGIC DYNAMIC BACKGROUND ACCENT (THREE.JS TRUE 3D)
// ==========================================
function initDynamicAccent() {
    const container = document.getElementById('webgl-container');
    // Pastikan container ada dan script Three.js sudah ter-load dari CDN
    if (!container || typeof THREE === 'undefined') return;

    // 1. Setup Scene, Camera, & Renderer (Dioptimasi untuk performa web)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Batasi Pixel Ratio agar enteng di device layar Retina
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Deteksi Tema untuk menyesuaikan warna garis
    const isDark = document.documentElement.classList.contains('dark');
    const colorHex = isDark ? 0xffffff : 0x000000;
    const lineOpacity = isDark ? 0.10 : 0.06;

    // 3. Buat Objek Icosahedron (Parameter 0 = Low Poly asli)
    const geometry = new THREE.IcosahedronGeometry(14, 0); 
    const wireframe = new THREE.WireframeGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ 
        color: colorHex, 
        transparent: true, 
        opacity: lineOpacity 
    });
    
    // LineSegments digunakan alih-alih Mesh agar tembus pandang (pure wireframe)
    const icosahedron = new THREE.LineSegments(wireframe, material);
    scene.add(icosahedron);
    
    // Geser kamera ke belakang agar objek terlihat
    camera.position.z = 35;

    // 4. Variabel untuk menampung target pergerakan mouse/scroll
    let targetRotX = 0;
    let targetRotY = 0;
    let scrollRotZ = 0;

    // Tangkap posisi kursor mouse
    window.addEventListener('mousemove', (e) => {
        const xRelative = (e.clientX / window.innerWidth - 0.5) * 2;
        const yRelative = (e.clientY / window.innerHeight - 0.5) * 2;
        // Mouse X memutar objek di sumbu Y (kiri-kanan)
        targetRotY = xRelative * 0.4; 
        // Mouse Y memutar objek di sumbu X (atas-bawah)
        targetRotX = yRelative * 0.4; 
    });

    // Tangkap event scroll
    window.addEventListener('scroll', () => {
        scrollRotZ = window.scrollY * 0.001;
    });

    // Responsif jika ukuran layar browser diubah
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // 5. Pantau perubahan tema dari tombol Toggle
    const observer = new MutationObserver(() => {
        const dark = document.documentElement.classList.contains('dark');
        material.color.setHex(dark ? 0xffffff : 0x000000);
        material.opacity = dark ? 0.10 : 0.06;
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // 6. Animation Loop (Lerp untuk pergerakan super mulus)
    function animate() {
        requestAnimationFrame(animate);
        
        // Memutar objek secara bertahap menuju posisi target kursor (Interpolasi halus / Lerp)
        icosahedron.rotation.y += (targetRotY - icosahedron.rotation.y) * 0.05;
        icosahedron.rotation.x += (targetRotX - icosahedron.rotation.x) * 0.05;
        // Z Rotation murni mengikuti scroll
        icosahedron.rotation.z = scrollRotZ; 
        
        renderer.render(scene, camera);
    }
    
    // Mulai animasi
    animate();
}

// ==========================================
// LOGIC HALAMAN UTAMA (INDEX)
// ==========================================
async function initHome() {
    const container = document.getElementById('projects-container');
    if (!container) return;
    const { data: projects, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (error || projects.length === 0) {
        container.innerHTML = `<p class="text-neutral-500 font-light">No projects found.</p>`;
        return;
    }
    container.innerHTML = ''; 
    projects.forEach(proj => {
        const techs = proj.tech_stack.split(',').map(t => t.trim());
        let techHTML = techs.map(t => `<span class="border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 px-3 py-1 text-[10px] uppercase tracking-widest rounded-none">${t}</span>`).join('');
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
// LOGIC HALAMAN DETAIL (STEAM GALLERY + AUTOPLAY + FULLSCREEN)
// ==========================================
async function initDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    if (!projectId) return window.location.href = '/index.html';

    const { data: proj, error } = await supabase.from('projects').select('*').eq('id', projectId).single();
    const container = document.getElementById('project-detail-container');
    if (error || !proj) return container.innerHTML = `<h1 class="text-center text-red-500 mt-20">Project not found.</h1>`;
    
    // Gabungkan media
    let medias = [proj.image_url];
    if (proj.gallery_urls && proj.gallery_urls.trim() !== "") {
        const extraMedias = proj.gallery_urls.split(',').map(url => url.trim());
        medias = medias.concat(extraMedias);
    }

    const techs = proj.tech_stack.split(',').map(t => t.trim());
    let techHTML = techs.map(t => `<span class="border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 px-3 py-1 text-[10px] uppercase tracking-widest">${t}</span>`).join('');

    const checkIsVideo = (url) => url.match(/\.(mp4|webm|ogg)$/i);

    let thumbnailsHTML = '';
    if (medias.length > 1) {
        thumbnailsHTML = `<div class="flex gap-4 mt-4 overflow-x-auto pb-4 scrollbar-hide" id="thumbs-container">`;
        medias.forEach((media, index) => {
            let thumbContent = checkIsVideo(media) 
                ? `<video src="${media}" class="w-full h-full object-cover pointer-events-none"></video><div class="absolute inset-0 flex items-center justify-center bg-black/30"><svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4l12 6-12 6z"/></svg></div>`
                : `<img src="${media}" class="w-full h-full object-cover">`;
            thumbnailsHTML += `
                <div class="gallery-thumb relative w-32 aspect-video bg-neutral-200 dark:bg-neutral-800 cursor-pointer border-2 transition-all duration-300 ${index === 0 ? 'border-black dark:border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-100'} flex-shrink-0" data-index="${index}">
                    ${thumbContent}
                </div>`;
        });
        thumbnailsHTML += `</div>`;
    }

    let actionButtonHTML = proj.demo_url ? `
        <div class="pt-10 border-t border-neutral-200 dark:border-neutral-800">
            <a href="${proj.demo_url}" target="_blank" class="inline-flex items-center justify-center bg-black text-white dark:bg-white dark:text-black font-semibold uppercase tracking-widest text-xs py-4 px-10 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors">Try Out / Visit Site</a>
        </div>` : '';

    container.innerHTML = `
        <div class="mb-10">
            <h1 class="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6">${proj.title}</h1>
            <div class="flex flex-wrap gap-2">${techHTML}</div>
        </div>
        
        <div class="mb-12">
            <div id="main-media-container" class="relative group w-full aspect-video bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center overflow-hidden cursor-zoom-in">
                 <div id="main-media-content" class="w-full h-full"></div>
                 
                 ${medias.length > 1 ? `
                 <button id="prev-media" class="absolute left-4 top-1/2 -translate-y-1/2 bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm z-10" onclick="event.stopPropagation()">
                    <svg class="w-6 h-6 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                 </button>
                 <button id="next-media" class="absolute right-4 top-1/2 -translate-y-1/2 bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm z-10" onclick="event.stopPropagation()">
                    <svg class="w-6 h-6 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                 </button>` : ''}
            </div>
            ${thumbnailsHTML}
        </div>
        <div class="prose prose-neutral dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-400 leading-relaxed font-light mb-16 text-lg whitespace-pre-wrap">${proj.description}</div>
        ${actionButtonHTML}
    `;

    // --- CAROUSEL & LIGHTBOX LOGIC ---
    let currentIndex = 0;
    let autoPlayTimer;
    const mainContent = document.getElementById('main-media-content');
    const mainWrapper = document.getElementById('main-media-container');
    const thumbs = document.querySelectorAll('.gallery-thumb');

    function renderMainMedia(index) {
        currentIndex = index;
        const url = medias[currentIndex];
        if (checkIsVideo(url)) {
            mainContent.innerHTML = `<video src="${url}" class="w-full h-full object-contain bg-black" controls autoplay muted playsinline></video>`;
        } else {
            mainContent.innerHTML = `<img src="${url}" alt="Project Media" class="w-full h-full object-cover">`;
        }
        
        // Update thubmnails
        thumbs.forEach(t => {
            t.classList.remove('border-black', 'dark:border-white', 'opacity-100');
            t.classList.add('border-transparent', 'opacity-50');
            if (parseInt(t.getAttribute('data-index')) === currentIndex) {
                t.classList.remove('border-transparent', 'opacity-50');
                t.classList.add('border-black', 'dark:border-white', 'opacity-100');
            }
        });
    }

    renderMainMedia(0);

    if (medias.length > 1) {
        const nextMedia = () => renderMainMedia((currentIndex + 1) % medias.length);
        const prevMedia = () => renderMainMedia((currentIndex - 1 + medias.length) % medias.length);

        document.getElementById('next-media').addEventListener('click', nextMedia);
        document.getElementById('prev-media').addEventListener('click', prevMedia);

        thumbs.forEach(thumb => {
            thumb.addEventListener('click', function() {
                renderMainMedia(parseInt(this.getAttribute('data-index')));
            });
        });

        // Autoplay logic
        const startAutoPlay = () => autoPlayTimer = setInterval(nextMedia, 3000);
        const stopAutoPlay = () => clearInterval(autoPlayTimer);
        
        startAutoPlay();
        mainWrapper.addEventListener('mouseenter', stopAutoPlay);
        mainWrapper.addEventListener('mouseleave', startAutoPlay);
    }

    // Fullscreen Overlay (Lightbox)
    mainWrapper.addEventListener('click', () => {
        const url = medias[currentIndex];
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out transition-opacity duration-300 opacity-0';
        
        let mediaTag = checkIsVideo(url) 
            ? `<video src="${url}" class="max-w-full max-h-full rounded shadow-2xl" controls autoplay playsinline></video>`
            : `<img src="${url}" class="max-w-full max-h-full object-contain rounded shadow-2xl">`;
        
        overlay.innerHTML = `
            <button class="absolute top-6 right-6 text-white hover:text-gray-300">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            ${mediaTag}
        `;
        
        document.body.appendChild(overlay);
        // Trigger fade in
        requestAnimationFrame(() => overlay.classList.remove('opacity-0'));

        overlay.addEventListener('click', () => {
            overlay.classList.add('opacity-0');
            setTimeout(() => overlay.remove(), 300);
        });
    });
}

// ==========================================
// LOGIC HALAMAN ADMIN (MANAGEMENT MEDIA)
// ==========================================
let editingProjectId = null; 
let existingImageUrl = ""; 
let existingGalleryArray = []; 

// Fungsi global untuk menghapus gambar dari list saat edit
window.removeExistingThumbnail = function() {
    existingImageUrl = "";
    document.getElementById('existing-thumbnail-preview').classList.add('hidden');
}

window.removeExistingGalleryItem = function(index) {
    existingGalleryArray.splice(index, 1);
    renderGalleryPreview(); // Refresh tampilan
}

function renderGalleryPreview() {
    const container = document.getElementById('existing-gallery-preview');
    container.innerHTML = '';
    if (existingGalleryArray.length === 0) {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    existingGalleryArray.forEach((url, index) => {
        const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
        const mediaTag = isVideo ? `<video src="${url}" class="w-16 h-16 object-cover bg-black"></video>` : `<img src="${url}" class="w-16 h-16 object-cover bg-neutral-200">`;
        
        container.innerHTML += `
            <div class="flex items-center justify-between bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-2">
                <div class="flex items-center gap-3">
                    ${mediaTag}
                    <span class="text-xs text-neutral-500 truncate max-w-[150px]">Media ${index + 1}</span>
                </div>
                <button type="button" onclick="removeExistingGalleryItem(${index})" class="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-widest px-3">Remove</button>
            </div>
        `;
    });
}

async function initAdmin() {
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const addProjectForm = document.getElementById('add-project-form');
    
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

    if(cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            editingProjectId = null;
            existingImageUrl = "";
            existingGalleryArray = [];
            document.getElementById('existing-thumbnail-preview').classList.add('hidden');
            document.getElementById('existing-gallery-preview').classList.add('hidden');
            
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
        
        const coverInput = document.getElementById('proj-image');
        const galleryInput = document.getElementById('proj-gallery');
        
        let finalImageUrl = existingImageUrl;
        let finalGalleryUrls = existingGalleryArray.join(',');

        // 1. Upload Cover
        if (coverInput.files && coverInput.files.length > 0) {
            const file = coverInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `cover_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${fileExt}`; 
            const { error: uploadError } = await supabase.storage.from('portfolio-images').upload(fileName, file);
            if (!uploadError) {
                const { data: publicUrlData } = supabase.storage.from('portfolio-images').getPublicUrl(fileName);
                finalImageUrl = publicUrlData.publicUrl;
            }
        } 
        
        // Block jika tidak ada thumbnail sama sekali (baik lama maupun baru)
        if (!finalImageUrl) {
            alert('Tolong sediakan Thumbnail Cover (Upload baru atau gunakan yang lama)!');
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
            return;
        }

        // 2. Upload Gallery
        if (galleryInput && galleryInput.files && galleryInput.files.length > 0) {
            let uploadedUrls = [];
            for (let file of galleryInput.files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `gallery_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${fileExt}`; 
                const { error: uploadError } = await supabase.storage.from('portfolio-images').upload(fileName, file);
                if (!uploadError) {
                    const { data: publicUrlData } = supabase.storage.from('portfolio-images').getPublicUrl(fileName);
                    uploadedUrls.push(publicUrlData.publicUrl);
                }
            }
            if (uploadedUrls.length > 0) {
                // Gabungkan file lama dengan file baru
                finalGalleryUrls = [...existingGalleryArray, ...uploadedUrls].join(',');
            }
        }

        if (editingProjectId) {
            const { error: updateError } = await supabase.from('projects').update({ title, description, image_url: finalImageUrl, gallery_urls: finalGalleryUrls, tech_stack, demo_url }).eq('id', editingProjectId);
            if (updateError) alert('Gagal Update: ' + updateError.message);
            else alert('Project berhasil diperbarui!');
        } else {
            const { error: insertError } = await supabase.from('projects').insert([{ title, description, image_url: finalImageUrl, gallery_urls: finalGalleryUrls, tech_stack, demo_url }]);
            if (insertError) alert('Gagal Simpan: ' + insertError.message);
            else alert('Project berhasil ditambahkan!');
        }
        
        cancelEditBtn.click(); // Reset form otomatis
        loadAdminProjects();
    });
}

async function loadAdminProjects() {
    const list = document.getElementById('projects-list');
    const { data: projects } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    list.innerHTML = '';
    if (!projects || projects.length === 0) return list.innerHTML = '<p class="text-neutral-500 font-light text-sm">Belum ada project.</p>';
    projects.forEach(proj => {
        list.innerHTML += `
            <div class="border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-neutral-50 dark:bg-neutral-900/50 hover:border-neutral-400">
                <div>
                    <h3 class="font-bold text-lg tracking-tight mb-1">${proj.title}</h3>
                    <p class="text-sm text-neutral-500 font-light truncate w-full max-w-md">${proj.description}</p>
                </div>
                <div class="flex gap-4">
                    <button onclick="editProject(${proj.id})" class="text-xs font-semibold tracking-widest uppercase text-blue-500 hover:text-blue-700">Edit</button>
                    <button onclick="deleteProject(${proj.id})" class="text-xs font-semibold tracking-widest uppercase text-red-500 hover:text-red-700">Delete</button>
                </div>
            </div>
        `;
    });
}

window.editProject = async function(id) {
    const { data: proj, error } = await supabase.from('projects').select('*').eq('id', id).single();
    if(error) return alert("Gagal mengambil data project.");

    document.getElementById('proj-title').value = proj.title;
    document.getElementById('proj-tech').value = proj.tech_stack;
    document.getElementById('proj-demo').value = proj.demo_url || '';
    document.getElementById('proj-desc').value = proj.description;
    
    editingProjectId = proj.id;
    existingImageUrl = proj.image_url; 
    existingGalleryArray = proj.gallery_urls ? proj.gallery_urls.split(',').map(s=>s.trim()) : []; 

    // Tampilkan Thumbnail Lama
    const thumbContainer = document.getElementById('existing-thumbnail-preview');
    if (existingImageUrl) {
        thumbContainer.innerHTML = `
            <div class="relative w-full max-w-[200px] aspect-[4/3] bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-2">
                <img src="${existingImageUrl}" class="w-full h-full object-cover">
                <button type="button" onclick="removeExistingThumbnail()" class="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center shadow-lg font-bold">X</button>
            </div>
            <p class="text-[10px] text-neutral-400 mt-2 italic">Current thumbnail. Click 'X' to remove.</p>
        `;
        thumbContainer.classList.remove('hidden');
    }

    // Tampilkan Gallery Lama
    renderGalleryPreview();

    const formTitle = document.getElementById('form-title');
    const submitBtn = document.getElementById('submit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    
    if(formTitle) formTitle.textContent = "Edit Project: " + proj.title;
    if(submitBtn) submitBtn.textContent = "Update Project";
    if(cancelEditBtn) cancelEditBtn.classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.deleteProject = async function(id) {
    if(confirm('Yakin ingin menghapus project ini?')) {
        await supabase.from('projects').delete().eq('id', id);
        if(window.location.pathname.includes('access.html')) initAdmin(); 
    }
}