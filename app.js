import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
    getDatabase,
    ref,
    onValue,
    set,
    get,
    push,
    remove,
    update
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

const firebaseConfig = {
    databaseURL: "https://project-2980864980936907935-default-rtdb.firebaseio.com/"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.showScreen = function(screenId) {
    document.querySelectorAll(".container, .dashboard").forEach(div => {
        div.classList.add("hidden");
    });
    document.getElementById(screenId).classList.remove("hidden");
};

// ==================== تسجيل الزبون ====================
window.clientLogin = function () {
    const name = document.getElementById("clientName").value.trim();
    const phone = document.getElementById("clientPhone").value.trim();

    if (name === "" || phone === "") {
        document.getElementById("clientError").innerText = "يرجى تعبئة جميع الحقول";
        document.getElementById("clientError").classList.remove("hidden");
        return;
    }

    localStorage.setItem("clientName", name);
    localStorage.setItem("clientPhone", phone);
    loadBarbers();
    showScreen("clientDashboard");
};

// ==================== تسجيل الحلاق ====================
window.barberSignup = function () {
    const name = document.getElementById("barberName").value.trim();
    const phone = document.getElementById("newBarberPhone").value.trim();
    const city = document.getElementById("barberCity").value.trim();
    const location = document.getElementById("barberLocation").value.trim();
    const password = document.getElementById("newBarberPassword").value.trim();
    const confirmPassword = document.getElementById("confirmBarberPassword").value.trim();

    if (!name || !phone || !city || !location || !password || !confirmPassword) {
        alert("يرجى تعبئة جميع الحقول");
        return;
    }

    if (password.length < 6) {
        alert("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
        return;
    }

    if (password !== confirmPassword) {
        alert("كلمتا المرور غير متطابقتين");
        return;
    }

    const barberRef = ref(db, "barbers/" + phone);
    set(barberRef, {
        name,
        phone,
        city,
        location,
        password,
        status: true
    }).then(() => {
        localStorage.setItem("barberPhone", phone);
        showScreen("barberDashboard");
        loadQueue(phone);
    });
};

// ==================== تسجيل دخول الحلاق ====================
window.barberLogin = function () {
    const phone = document.getElementById("barberPhone").value.trim();
    const password = document.getElementById("barberPassword").value.trim();

    const barberRef = ref(db, "barbers/" + phone);
    get(barberRef).then(snapshot => {
        if (snapshot.exists() && snapshot.val().password === password) {
            localStorage.setItem("barberPhone", phone);
            showScreen("barberDashboard");
            loadQueue(phone);
        } else {
            alert("بيانات الدخول غير صحيحة");
        }
    });
};

// ==================== تحميل قائمة الانتظار ====================
function loadQueue(phone) {
    const queueRef = ref(db, "queues/" + phone);
    onValue(queueRef, snapshot => {
        const list = document.getElementById("barberQueue");
        list.innerHTML = "";
        snapshot.forEach(child => {
            const item = document.createElement("li");
            item.className = "queue-item";
            item.innerHTML = `
                <div class="queue-info">
                    <div class="queue-position">#${child.key}</div>
                    <div class="queue-name">${child.val().name}</div>
                    <div class="queue-time">${child.val().time || ""}</div>
                </div>
                <button class="delete-btn" onclick="removeClient('${phone}', '${child.key}')">×</button>
            `;
            list.appendChild(item);
        });
    });
}

window.removeClient = function(phone, clientId) {
    const clientRef = ref(db, "queues/" + phone + "/" + clientId);
    remove(clientRef);
};

// ==================== تحميل الحلاقين للزبون ====================
function loadBarbers() {
    const barbersRef = ref(db, "barbers");
    onValue(barbersRef, snapshot => {
        const list = document.getElementById("barbersList");
        list.innerHTML = "";
        snapshot.forEach(child => {
            const barber = child.val();
            const card = document.createElement("div");
            card.className = "barber-card";
            card.setAttribute("data-city", barber.city || ""); // <-- مهم للبحث
            card.innerHTML = `
                <div class="barber-info">
                    <div class="barber-header">
                        <div class="barber-avatar">${barber.name[0]}</div>
                        <div>
                            <div class="barber-name">${barber.name}</div>
                            <div class="barber-status">${barber.status ? "مفتوح" : "مغلق"}</div>
                        </div>
                    </div>
                    <div class="barber-location">${barber.city} - ${barber.location}</div>
                    <button class="login-btn" onclick="bookNow('${child.key}')">احجز الآن</button>
                </div>
            `;
            list.appendChild(card);
        });
    });
}

// ==================== الحجز ====================
window.bookNow = function(barberPhone) {
    const name = localStorage.getItem("clientName");
    const phone = localStorage.getItem("clientPhone");
    const queueRef = ref(db, "queues/" + barberPhone);
    const newClientRef = push(queueRef);
    set(newClientRef, {
        name,
        phone,
        time: new Date().toLocaleTimeString()
    });
    alert("تم الحجز بنجاح!");
};

// ==================== تسجيل خروج ====================
window.logout = function () {
    localStorage.clear();
    location.reload();
};

// ==================== تبديل بين التسجيل وتسجيل الدخول للحلاق ====================
window.showBarberSignup = function () {
    document.getElementById("barberLoginForm").classList.add("hidden");
    document.getElementById("barberSignupForm").classList.remove("hidden");
    document.getElementById("barberFormTitle").innerText = "إنشاء حساب حلاق";
};

window.showBarberLogin = function () {
    document.getElementById("barberLoginForm").classList.remove("hidden");
    document.getElementById("barberSignupForm").classList.add("hidden");
    document.getElementById("barberFormTitle").innerText = "تسجيل الدخول للحلاقين";
};

// ==================== البحث حسب المدينة ====================
window.filterBarbersByCity = function () {
    const searchValue = document.getElementById("citySearch").value.trim().toLowerCase();
    const cards = document.querySelectorAll(".barber-card");

    cards.forEach(card => {
        const city = card.getAttribute("data-city")?.toLowerCase() || "";
        card.style.display = city.includes(searchValue) ? "block" : "none";
    });
};
