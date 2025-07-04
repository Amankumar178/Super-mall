// Firebase initialization assumed to be in firebase-config.js
const db = firebase.firestore();

// Logger function (calls logger.js)
function logAction(action, details) {
    console.log(`[LOG] ${action}:`, details);
    // Extend with custom logging if needed
}

function exportToCSV(data, filename) {
    const csvRows = [];
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(","));

    data.forEach(row => {
        const values = headers.map(header => JSON.stringify(row[header] || ""));
        csvRows.push(values.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function adminLogin() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(user => {
            alert("Logged in successfully");
            logAction("Admin Login", { email });
        })
        .catch(error => {
            alert("Login failed: " + error.message);
        });
}

function createShop() {
    const name = document.getElementById("shopName").value;
    const category = document.getElementById("shopCategory").value;
    const floor = document.getElementById("shopFloor").value;

    db.collection("shops").add({ name, category, floor })
        .then(doc => {
            alert("Shop created successfully");
            logAction("Shop Created", { name, category, floor });
        })
        .catch(err => alert("Error: " + err.message));
}

function addProduct() {
    const name = document.getElementById("productName").value;
    const brand = document.getElementById("productBrand").value;
    const price = parseFloat(document.getElementById("productPrice").value);
    const rating = parseFloat(document.getElementById("productRating").value);

    db.collection("products").add({ name, brand, price, rating })
        .then(() => {
            alert("Product added successfully");
            logAction("Product Added", { name, brand, price, rating });
        })
        .catch(err => alert("Error: " + err.message));
}

function addOffer() {
    const shop = document.getElementById("offerShop").value;
    const title = document.getElementById("offerTitle").value;
    const desc = document.getElementById("offerDesc").value;

    db.collection("offers").add({ shop, title, desc })
        .then(() => {
            alert("Offer added successfully");
            logAction("Offer Added", { shop, title });
        })
        .catch(err => alert("Error: " + err.message));
}

function compareProducts() {
    const name1 = document.getElementById("compareProduct1").value.trim();
    const name2 = document.getElementById("compareProduct2").value.trim();
    const resultDiv = document.getElementById("compareResult");
    resultDiv.innerHTML = "Loading...";

    if (!name1 || !name2) {
        resultDiv.innerHTML = "Please enter both product names.";
        return;
    }

    Promise.all([
        db.collection("products").where("name", "==", name1).get(),
        db.collection("products").where("name", "==", name2).get()
    ]).then(([snap1, snap2]) => {
        if (snap1.empty || snap2.empty) {
            resultDiv.innerHTML = "One or both products not found.";
            return;
        }

        const prod1 = snap1.docs[0].data();
        const prod2 = snap2.docs[0].data();

        resultDiv.innerHTML = `
            <table border="1" cellpadding="10">
                <tr><th>Feature</th><th>${prod1.name}</th><th>${prod2.name}</th></tr>
                <tr><td>Price</td><td>${prod1.price}</td><td>${prod2.price}</td></tr>
                <tr><td>Brand</td><td>${prod1.brand}</td><td>${prod2.brand}</td></tr>
                <tr><td>Rating</td><td>${prod1.rating}</td><td>${prod2.rating}</td></tr>
            </table>
        `;

        logAction("Compared Products", { product1: name1, product2: name2 });

    }).catch(err => {
        resultDiv.innerHTML = "Error: " + err.message;
    });
}

function filterShops() {
    const category = document.getElementById("filterCategory").value.trim();
    const floor = document.getElementById("filterFloor").value.trim();
    const resultDiv = document.getElementById("filterResults");
    resultDiv.innerHTML = "Searching...";

    let query = db.collection("shops");
    if (category) query = query.where("category", "==", category);
    if (floor) query = query.where("floor", "==", floor);

    query.get().then(snapshot => {
        if (snapshot.empty) {
            resultDiv.innerHTML = "No matching shops found.";
            return;
        }

        let html = "<ul>";
        snapshot.forEach(doc => {
            const shop = doc.data();
            html += `<li><strong>${shop.name}</strong> - Category: ${shop.category}, Floor: ${shop.floor}</li>`;
        });
        html += "</ul>";
        resultDiv.innerHTML = html;

        logAction("Filtered Shops", { category, floor });

    }).catch(err => {
        resultDiv.innerHTML = "Error: " + err.message;
    });
}

function listShops() {
    const section = document.getElementById("shopList");
    section.innerHTML = "<h2>List of Shop Details</h2><p>Loading...</p><button onclick='downloadShopCSV()'>Export CSV</button>";

    db.collection("shops").get().then(snapshot => {
        if (snapshot.empty) {
            section.innerHTML += "<p>No shops found.</p>";
            return;
        }
        const allData = [];
        let html = "<ul>";
        snapshot.forEach(doc => {
            const shop = doc.data();
            allData.push(shop);
            html += `<li>${shop.name} - ${shop.category}, Floor: ${shop.floor}</li>`;
        });
        html += "</ul>";
        section.innerHTML = `<h2>List of Shop Details</h2><button onclick='downloadShopCSV()'>Export CSV</button>${html}`;
        window.shopData = allData;
    });
}

function downloadShopCSV() {
    if (window.shopData) exportToCSV(window.shopData, "shops.csv");
}

function listProducts() {
    const section = document.getElementById("offerProducts");
    section.innerHTML = "<h2>List Offer Products</h2><p>Loading...</p><button onclick='downloadProductCSV()'>Export CSV</button>";

    db.collection("products").get().then(snapshot => {
        if (snapshot.empty) {
            section.innerHTML += "<p>No products found.</p>";
            return;
        }
        const allData = [];
        let html = "<ul>";
        snapshot.forEach(doc => {
            const prod = doc.data();
            allData.push(prod);
            html += `<li>${prod.name} - Brand: ${prod.brand}, Price: ₹${prod.price}, Rating: ${prod.rating}</li>`;
        });
        html += "</ul>";
        section.innerHTML = `<h2>List Offer Products</h2><button onclick='downloadProductCSV()'>Export CSV</button>${html}`;
        window.productData = allData;
    });
}

function downloadProductCSV() {
    if (window.productData) exportToCSV(window.productData, "products.csv");
}

function listOffers() {
    const section = document.getElementById("shopOffers");
    section.innerHTML = "<h2>Shop Wise Offers</h2><p>Loading...</p><button onclick='downloadOfferCSV()'>Export CSV</button>";

    db.collection("offers").get().then(snapshot => {
        if (snapshot.empty) {
            section.innerHTML += "<p>No offers found.</p>";
            return;
        }
        const allData = [];
        let html = "<ul>";
        snapshot.forEach(doc => {
            const offer = doc.data();
            allData.push(offer);
            html += `<li>${offer.shop} - ${offer.title}: ${offer.desc}</li>`;
        });
        html += "</ul>";
        section.innerHTML = `<h2>Shop Wise Offers</h2><button onclick='downloadOfferCSV()'>Export CSV</button>${html}`;
        window.offerData = allData;
    });
}

function downloadOfferCSV() {
    if (window.offerData) exportToCSV(window.offerData, "offers.csv");
}

// Auto-load content on tab switch
const triggers = ["shopList", "offerProducts", "shopOffers"];
document.querySelectorAll(".sidebar li").forEach(item => {
    item.addEventListener("click", () => {
        const id = item.getAttribute("data-section");
        if (triggers.includes(id)) {
            if (id === "shopList") listShops();
            else if (id === "offerProducts") listProducts();
            else if (id === "shopOffers") listOffers();
        }
    });
});
