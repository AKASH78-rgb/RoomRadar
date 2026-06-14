// Global State
let rooms = [
  {
    id: 1,
    title: "PG near Infosys Gate",
    address: "Infosys Gate Road, Hebbal, Mysuru",
    rent: 6500,
    type: "PG",
    gender: "girls",
    distance: 0.3,
    lat: 12.3582,
    lng: 76.6135,
    amenities: ["wifi", "food", "washing machine"],
    photos: ["images/room1.png", "images/room2.png", "images/room3.png"],
    ownerName: "Ramesh Kumar",
    ownerPhone: "9876543210",
    active: true
  },
  {
    id: 2,
    title: "Single room, Vijayanagar",
    address: "Vijayanagar 2nd Stage, near Water Tank, Mysuru",
    rent: 4200,
    type: "single",
    gender: "boys",
    distance: 0.7,
    lat: 12.3325,
    lng: 76.6190,
    amenities: ["wifi", "parking"],
    photos: ["images/room2.png", "images/room3.png", "images/room1.png"],
    ownerName: "Siddharth Gowda",
    ownerPhone: "9123456780",
    active: true
  },
  {
    id: 3,
    title: "2-share PG, girls only",
    address: "Gokulam 3rd Stage, near Yoga Kendra, Mysuru",
    rent: 5800,
    type: "double share",
    gender: "girls",
    distance: 1.1,
    lat: 12.3270,
    lng: 76.6325,
    amenities: ["wifi", "food", "ac", "washing machine"],
    photos: ["images/room3.png", "images/room1.png", "images/room2.png"],
    ownerName: "Ananya Hegde",
    ownerPhone: "8899001122",
    active: true
  }
];

let callsCount = 12;
let viewsCount = 142;
let uploadedPhotos = [];
let searchMap = null;
let detailMap = null;
let searchMarkers = [];
let detailMarker = null;

// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
  navigateTo("home");
  initSearchMap();
  
  // Custom scroll event for horizontal cards in Search view
  document.getElementById("room-cards-container").addEventListener("scroll", handleCardsScroll);
});

// ================= ROUTING & SWITCH VIEWS =================
function navigateTo(viewId) {
  // Hide all views
  document.querySelectorAll(".page-view").forEach(view => {
    view.classList.remove("active");
  });
  
  // Show target view
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.add("active");
  }
  
  // Update nav links
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.remove("active");
  });
  const activeNavItem = document.getElementById(`nav-${viewId}`);
  if (activeNavItem) {
    activeNavItem.classList.add("active");
  }
  
  // Action triggers for specific pages
  if (viewId === "search") {
    // Refresh map layout after container visibility changes
    setTimeout(() => {
      if (searchMap) {
        searchMap.invalidateSize();
        applyFilters();
      }
    }, 100);
  } else if (viewId === "dashboard") {
    renderDashboard();
  }
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ================= SEARCH MAP LOGIC =================
function initSearchMap() {
  const mapElement = document.getElementById("search-map");
  if (!mapElement) return;

  // Center on Gokulam/Hebbal, Mysuru
  searchMap = L.map("search-map", {
    zoomControl: false,
    attributionControl: false
  }).setView([12.342, 76.621], 13);

  // Use elegant CartoDB Positron theme (light styled map tiles)
  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    maxZoom: 20
  }).addTo(searchMap);

  // Put zoom control in bottom-right corner out of the way
  L.control.zoom({
    position: "bottomright"
  }).addTo(searchMap);
}

function renderPinsOnMap(filteredRooms) {
  // Clear existing markers
  searchMarkers.forEach(marker => searchMap.removeLayer(marker));
  searchMarkers = [];

  if (filteredRooms.length === 0) return;

  const bounds = [];

  filteredRooms.forEach(room => {
    if (!room.lat || !room.lng) return;

    // Create a custom price pin marker
    const pinHtml = `<div class="leaflet-price-pin" id="map-pin-${room.id}">₹${room.rent.toLocaleString('en-IN')}/mo</div>`;
    const customIcon = L.divIcon({
      html: pinHtml,
      className: "custom-leaflet-icon",
      iconSize: [60, 25],
      iconAnchor: [30, 25]
    });

    const marker = L.marker([room.lat, room.lng], { icon: customIcon }).addTo(searchMap);
    
    // Bind click event to trigger room highlighting and scrolling
    marker.on("click", () => {
      highlightRoomCard(room.id);
      searchMap.setView([room.lat, room.lng], 14, { animate: true });
    });

    searchMarkers.push(marker);
    bounds.push([room.lat, room.lng]);
  });

  // Fit map bounds to show all pins nicely
  if (bounds.length > 0) {
    searchMap.fitBounds(bounds, { padding: [40, 40] });
  }
}

// ================= LISTINGS FILTERING =================
function applyFilters() {
  const priceFilter = document.getElementById("filter-price").value;
  const genderFilter = document.getElementById("filter-gender").value;
  const locationQuery = document.getElementById("search-location").value.toLowerCase();

  const filtered = rooms.filter(room => {
    // Only show active rooms on search page
    if (!room.active) return false;

    // Location search
    const matchesLoc = room.title.toLowerCase().includes(locationQuery) || 
                       room.address.toLowerCase().includes(locationQuery);

    // Price range filter
    let matchesPrice = true;
    if (priceFilter === "low") {
      matchesPrice = room.rent < 5000;
    } else if (priceFilter === "mid") {
      matchesPrice = room.rent >= 5000 && room.rent <= 8000;
    } else if (priceFilter === "high") {
      matchesPrice = room.rent > 8000;
    }

    // Gender filter
    let matchesGender = true;
    if (genderFilter === "girls") {
      matchesGender = room.gender === "girls";
    } else if (genderFilter === "boys") {
      matchesGender = room.gender === "boys";
    }

    return matchesLoc && matchesPrice && matchesGender;
  });

  renderRoomCards(filtered);
  renderPinsOnMap(filtered);
}

// Bind typing event to search input with debounce
let searchTimeout;
document.getElementById("search-location").addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(applyFilters, 300);
});

// Render dynamic room cards in horizontal slider
function renderRoomCards(filteredList) {
  const container = document.getElementById("room-cards-container");
  container.innerHTML = "";

  if (filteredList.length === 0) {
    container.innerHTML = `<div class="no-rooms-fallback">No rooms found matching your search filters. Try resetting them!</div>`;
    return;
  }

  filteredList.forEach(room => {
    const mainPhoto = (room.photos && room.photos.length > 0) ? room.photos[0] : 'images/room1.png';
    const genderLabel = room.gender === 'girls' ? 'Girls Only' : (room.gender === 'boys' ? 'Boys Only' : 'Any Gender');
    const genderClass = room.gender === 'girls' ? 'girls' : (room.gender === 'boys' ? 'boys' : 'any');
    const genderIcon = room.gender === 'girls' ? 'fa-venus' : (room.gender === 'boys' ? 'fa-mars' : 'fa-venus-mars');

    const card = document.createElement("div");
    card.className = "room-card";
    card.id = `room-card-${room.id}`;
    card.setAttribute("data-id", room.id);
    
    // Clicking card opens room details (unless user clicks the Call button)
    card.addEventListener("click", (e) => {
      if (!e.target.closest(".btn-call-owner")) {
        openDetailsModal(room.id);
      }
    });

    card.innerHTML = `
      <div class="room-img-container">
        <img src="${mainPhoto}" class="room-img" alt="${room.title}" onerror="this.src='images/room1.png'">
        <span class="gender-badge ${genderClass}">
          <i class="fa-solid ${genderIcon}"></i> ${genderLabel}
        </span>
      </div>
      <div class="room-info-header">
        <div class="room-title">${room.title}</div>
        <div class="room-distance"><i class="fa-solid fa-location-dot"></i> ${room.distance} km away</div>
      </div>
      <div class="room-price-row">
        <div class="room-price">₹${room.rent.toLocaleString('en-IN')}<span> / mo</span></div>
        <button class="btn-call-owner" onclick="simulateCall('${room.ownerName}', '${room.ownerPhone}', event)">
          <i class="fa-solid fa-phone"></i> Call owner
        </button>
      </div>
    `;
    
    container.appendChild(card);
  });
}

// ================= INTERACTIVE SCROLL & HIGHLIGHTS =================
function highlightRoomCard(id) {
  // Highlight card element
  document.querySelectorAll(".room-card").forEach(card => {
    card.classList.remove("highlighted");
  });
  
  const selectedCard = document.getElementById(`room-card-${id}`);
  if (selectedCard) {
    selectedCard.classList.add("highlighted");
    
    // Smoothly scroll container horizontally to active card
    const container = document.getElementById("room-cards-container");
    const containerLeft = container.getBoundingClientRect().left;
    const cardLeft = selectedCard.getBoundingClientRect().left;
    const offset = cardLeft - containerLeft - 16; // 16px buffer padding
    
    container.scrollBy({
      left: offset,
      behavior: "smooth"
    });
  }

  // Highlight corresponding marker pin
  document.querySelectorAll(".leaflet-price-pin").forEach(pin => {
    pin.classList.remove("selected");
  });
  const activePin = document.getElementById(`map-pin-${id}`);
  if (activePin) {
    activePin.classList.add("selected");
  }
}

// Auto highlight map pin based on which card is scrolled in view
function handleCardsScroll() {
  const container = document.getElementById("room-cards-container");
  const cards = container.querySelectorAll(".room-card");
  if (cards.length === 0) return;

  const containerCenter = container.getBoundingClientRect().left + (container.offsetWidth / 2);
  
  let closestCard = null;
  let minDiff = Infinity;

  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const cardCenter = rect.left + (rect.width / 2);
    const diff = Math.abs(containerCenter - cardCenter);
    if (diff < minDiff) {
      minDiff = diff;
      closestCard = card;
    }
  });

  if (closestCard) {
    const roomId = parseInt(closestCard.getAttribute("data-id"));
    // Highlight pin on map without re-triggering container scroll (prevent feedback loops)
    document.querySelectorAll(".leaflet-price-pin").forEach(pin => {
      pin.classList.remove("selected");
    });
    const activePin = document.getElementById(`map-pin-${roomId}`);
    if (activePin) {
      activePin.classList.add("selected");
    }
  }
}

// ================= ROOM DETAIL MODAL =================
function openDetailsModal(id) {
  const room = rooms.find(r => r.id === id);
  if (!room) return;

  // Populate data
  document.getElementById("detail-title").innerText = room.title;
  document.getElementById("detail-distance").innerText = `${room.distance} km away`;
  document.getElementById("detail-address").innerText = room.address;
  document.getElementById("detail-price").innerText = `₹${room.rent.toLocaleString('en-IN')}`;
  
  // Populate tags (Gender, Room Type)
  const tagsContainer = document.getElementById("detail-tags");
  tagsContainer.innerHTML = "";
  
  const genderLabel = room.gender === 'girls' ? 'Girls Only' : (room.gender === 'boys' ? 'Boys Only' : 'Any Gender');
  const genderClass = room.gender === 'girls' ? 'girls' : (room.gender === 'boys' ? 'boys' : 'any');
  
  const genderBadge = document.createElement("span");
  genderBadge.className = `gender-badge ${genderClass}`;
  genderBadge.innerHTML = `<i class="fa-solid ${room.gender === 'girls' ? 'fa-venus' : (room.gender === 'boys' ? 'fa-mars' : 'fa-venus-mars')}"></i> ${genderLabel}`;
  tagsContainer.appendChild(genderBadge);

  const typeBadge = document.createElement("span");
  typeBadge.className = "gender-badge any"; // default green style for type
  typeBadge.innerHTML = `<i class="fa-solid fa-hotel"></i> ${room.type.toUpperCase()}`;
  tagsContainer.appendChild(typeBadge);

  // Populate Owner Details
  document.getElementById("detail-owner-name").innerText = room.ownerName;
  document.getElementById("detail-owner-avatar").innerText = room.ownerName.charAt(0).toUpperCase();
  
  // Set caller parameters
  document.getElementById("btn-detail-call").setAttribute("onclick", `callOwnerAction('${room.ownerName}', '${room.ownerPhone}')`);

  // Render Image Gallery (3-4 photo slots)
  const gallery = document.getElementById("detail-gallery");
  gallery.innerHTML = "";

  const p1 = room.photos && room.photos[0] ? room.photos[0] : 'images/room1.png';
  const p2 = room.photos && room.photos[1] ? room.photos[1] : 'images/room2.png';
  const p3 = room.photos && room.photos[2] ? room.photos[2] : 'images/room3.png';
  
  gallery.innerHTML = `
    <div class="gallery-main">
      <img src="${p1}" alt="Main photo" onerror="this.src='images/room1.png'">
    </div>
    <div class="gallery-side">
      <div class="gallery-thumb"><img src="${p2}" alt="Room photo 2" onerror="this.src='images/room2.png'"></div>
      <div class="gallery-thumb">
        <img src="${p3}" alt="Room photo 3" onerror="this.src='images/room3.png'">
        <div class="gallery-more-overlay">+2 More</div>
      </div>
    </div>
  `;

  // Render Amenities checklist
  const amenitiesList = ["wifi", "food", "ac", "parking", "washing machine"];
  const amMap = {
    "wifi": { label: "Free Wifi", icon: "fa-wifi" },
    "food": { label: "Food Included", icon: "fa-utensils" },
    "ac": { label: "Air Conditioning", icon: "fa-wind" },
    "parking": { label: "Parking Space", icon: "fa-car" },
    "washing machine": { label: "Washing Machine", icon: "fa-tshirt" }
  };

  const amContainer = document.getElementById("detail-amenities");
  amContainer.innerHTML = "";

  amenitiesList.forEach(am => {
    const presents = room.amenities.includes(am);
    const item = document.createElement("div");
    item.className = `amenity-item ${presents ? '' : 'missing'}`;
    item.innerHTML = `
      <i class="fa-solid ${presents ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>
      <span><i class="fa-solid ${amMap[am].icon}"></i> ${amMap[am].label}</span>
    `;
    amContainer.appendChild(item);
  });

  // Open the Modal View
  const modal = document.getElementById("detail-modal");
  modal.classList.add("active");

  // Initialise Detail Small Map (Deferred)
  setTimeout(() => {
    initDetailMap(room);
  }, 350);
}

function closeDetailsModal(event = null) {
  const modal = document.getElementById("detail-modal");
  modal.classList.remove("active");
  
  if (detailMap) {
    detailMap.remove();
    detailMap = null;
    detailMarker = null;
  }
}

function initDetailMap(room) {
  if (detailMap) {
    detailMap.remove();
  }

  detailMap = L.map("detail-map", {
    zoomControl: false,
    attributionControl: false
  }).setView([room.lat, room.lng], 15);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png").addTo(detailMap);

  // Custom green marker pin for single room
  const pinHtml = `<div class="leaflet-price-pin selected">₹${room.rent.toLocaleString('en-IN')}</div>`;
  const customIcon = L.divIcon({
    html: pinHtml,
    className: "custom-leaflet-icon",
    iconSize: [60, 25],
    iconAnchor: [30, 25]
  });

  detailMarker = L.marker([room.lat, room.lng], { icon: customIcon }).addTo(detailMap);
  detailMap.invalidateSize();
}

function callOwnerAction(name, phone) {
  closeDetailsModal();
  simulateCall(name, phone);
}

// ================= LISTING FORM LOGIC =================
function toggleTile(tileId) {
  const checkbox = document.querySelector(`#${tileId} input`);
  const tile = document.getElementById(tileId);
  if (checkbox.checked) {
    tile.classList.add("checked");
  } else {
    tile.classList.remove("checked");
  }
}

// Handle Photo File Upload Simulator
function handleFileSelect(e) {
  const files = e.target.files;
  if (!files) return;

  const totalPossible = 5 - uploadedPhotos.length;
  const loopCount = Math.min(files.length, totalPossible);

  for (let i = 0; i < loopCount; i++) {
    const file = files[i];
    const reader = new FileReader();
    reader.onload = function(event) {
      uploadedPhotos.push(event.target.result);
      renderUploadedPreviews();
    };
    reader.readAsDataURL(file);
  }
}

function renderUploadedPreviews() {
  const container = document.getElementById("photo-previews");
  container.innerHTML = "";

  uploadedPhotos.forEach((src, idx) => {
    const slot = document.createElement("div");
    slot.className = "photo-preview-slot";
    slot.innerHTML = `
      <img src="${src}" alt="preview">
      <button type="button" class="photo-preview-delete" onclick="deleteUploadedPhoto(${idx})">&times;</button>
    `;
    container.appendChild(slot);
  });
}

function deleteUploadedPhoto(idx) {
  uploadedPhotos.splice(idx, 1);
  renderUploadedPreviews();
}

function openCreateForm() {
  // Clear edit state
  document.getElementById("form-edit-id").value = "";
  document.getElementById("btn-submit-form").innerText = "Post my room";
  document.getElementById("room-listing-form").reset();
  
  // Clear checked tiles style
  document.querySelectorAll(".checkbox-tile").forEach(tile => tile.classList.remove("checked"));
  uploadedPhotos = [];
  renderUploadedPreviews();
  
  navigateTo("list");
}

function openEditForm(id) {
  const room = rooms.find(r => r.id === id);
  if (!room) return;

  navigateTo("list");

  // Populate form fields
  document.getElementById("form-edit-id").value = room.id;
  document.getElementById("form-title").value = room.title;
  document.getElementById("form-address").value = room.address;
  document.getElementById("form-rent").value = room.rent;
  document.getElementById("form-type").value = room.type;
  document.getElementById("form-gender").value = room.gender;
  document.getElementById("form-owner-name").value = room.ownerName;
  document.getElementById("form-owner-phone").value = room.ownerPhone;
  
  // Set amenities checkboxes
  const amenitiesList = ["wifi", "food", "ac", "parking", "washing"];
  amenitiesList.forEach(am => {
    const checkVal = am === "washing" ? "washing machine" : am;
    const checkbox = document.getElementById(`amenity-${am}`);
    checkbox.checked = room.amenities.includes(checkVal);
    
    // Sync style tile
    const tile = document.getElementById(`tile-${am}`);
    if (checkbox.checked) {
      tile.classList.add("checked");
    } else {
      tile.classList.remove("checked");
    }
  });

  // Pre-populate photos with dummy base64 or paths
  uploadedPhotos = [...room.photos];
  renderUploadedPreviews();

  // Change submit text
  document.getElementById("btn-submit-form").innerText = "Save changes";
}

function handleFormSubmit(e) {
  e.preventDefault();

  const editId = document.getElementById("form-edit-id").value;
  const title = document.getElementById("form-title").value;
  const address = document.getElementById("form-address").value;
  const rent = parseInt(document.getElementById("form-rent").value);
  const type = document.getElementById("form-type").value;
  const gender = document.getElementById("form-gender").value;
  const ownerName = document.getElementById("form-owner-name").value;
  const ownerPhone = document.getElementById("form-owner-phone").value;

  // Gather amenities checkboxes
  const amenities = [];
  document.querySelectorAll(".checkboxes-grid input:checked").forEach(checkbox => {
    amenities.push(checkbox.value);
  });

  // Photo fallback
  const finalPhotos = uploadedPhotos.length > 0 ? uploadedPhotos : ["images/room1.png", "images/room2.png", "images/room3.png"];

  if (editId) {
    // Edit existing room
    const index = rooms.findIndex(r => r.id === parseInt(editId));
    if (index !== -1) {
      rooms[index] = {
        ...rooms[index],
        title,
        address,
        rent,
        type,
        gender,
        amenities,
        photos: finalPhotos,
        ownerName,
        ownerPhone
      };
    }
  } else {
    // Create new room
    // Generate mock coordinates around Hebbal/Gokulam area
    const centerLat = 12.342;
    const centerLng = 76.621;
    const latOffset = (Math.random() - 0.5) * 0.04;
    const lngOffset = (Math.random() - 0.5) * 0.04;

    const newRoom = {
      id: Date.now(),
      title,
      address,
      rent,
      type,
      gender,
      distance: parseFloat((Math.random() * 2 + 0.1).toFixed(1)),
      lat: centerLat + latOffset,
      lng: centerLng + lngOffset,
      amenities,
      photos: finalPhotos,
      ownerName,
      ownerPhone,
      active: true
    };
    rooms.push(newRoom);
  }

  // Reset Form
  document.getElementById("room-listing-form").reset();
  uploadedPhotos = [];
  renderUploadedPreviews();

  // Redirect to dashboard to check
  navigateTo("dashboard");
}

// ================= OWNER DASHBOARD LOGIC =================
function renderDashboard() {
  // Update stats
  const totalListings = rooms.length;
  document.getElementById("stat-listings-count").innerText = totalListings;
  document.getElementById("stat-calls-count").innerText = callsCount;
  
  // Dynamic Views scaling with listing size
  document.getElementById("stat-views-count").innerText = viewsCount + (totalListings * 15);

  const container = document.getElementById("dashboard-listings-list");
  container.innerHTML = "";

  if (rooms.length === 0) {
    container.innerHTML = `<div class="no-rooms-fallback" style="padding: 3rem 0;">You haven't listed any rooms yet. Click the "+" button below to get started!</div>`;
    return;
  }

  rooms.forEach(room => {
    const mainPhoto = room.photos && room.photos[0] ? room.photos[0] : 'images/room1.png';
    const row = document.createElement("div");
    row.className = "dash-listing-row";
    row.innerHTML = `
      <div class="dash-list-left">
        <img src="${mainPhoto}" class="dash-room-thumb" alt="${room.title}" onerror="this.src='images/room1.png'">
        <div class="dash-room-details">
          <h4>${room.title}</h4>
          <p>₹${room.rent.toLocaleString('en-IN')} / month</p>
        </div>
      </div>
      <div class="dash-list-actions">
        <!-- Toggle Active Status Badge -->
        <span class="status-badge ${room.active ? 'active' : 'inactive'}" onclick="toggleRoomActive(${room.id})">
          ${room.active ? 'Active' : 'Inactive'}
        </span>
        <!-- Edit and Delete buttons -->
        <button class="action-icon-btn edit" onclick="openEditForm(${room.id})" title="Edit listing">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="action-icon-btn delete" onclick="deleteRoom(${room.id})" title="Delete listing">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;
    container.appendChild(row);
  });
}

function toggleRoomActive(id) {
  const room = rooms.find(r => r.id === id);
  if (room) {
    room.active = !room.active;
    renderDashboard();
    
    // Re-apply filter on maps to reflect active changes
    if (searchMap) {
      applyFilters();
    }
  }
}

let deleteTargetId = null;

function deleteRoom(id) {
  deleteTargetId = id;
  const modal = document.getElementById("confirm-delete-modal");
  if (modal) {
    modal.classList.add("active");
    
    // Bind click event to confirm delete button
    const confirmBtn = document.getElementById("btn-confirm-delete");
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        executeDelete();
      };
    }
  }
}

function closeDeleteConfirm() {
  const modal = document.getElementById("confirm-delete-modal");
  if (modal) {
    modal.classList.remove("active");
  }
  deleteTargetId = null;
}

function executeDelete() {
  if (deleteTargetId !== null) {
    rooms = rooms.filter(r => r.id !== deleteTargetId);
    renderDashboard();
    
    // Re-apply filters
    if (searchMap) {
      applyFilters();
    }
    closeDeleteConfirm();
  }
}

// ================= CALL SIMULATOR LOGIC =================
function simulateCall(ownerName, ownerPhone, e = null) {
  if (e) {
    e.stopPropagation(); // Stop click from propagating to map/card links
  }

  // Increment call counters
  callsCount++;
  
  // Set UI data
  document.getElementById("call-owner-name").innerText = ownerName;
  document.getElementById("call-phone-num").innerText = `+91 ${ownerPhone}`;
  document.getElementById("call-avatar-circle").innerText = ownerName.charAt(0).toUpperCase();

  // Show dialer overlay
  const callModal = document.getElementById("call-modal");
  callModal.classList.add("active");
  
  // Sync dashboard counters
  const statCalls = document.getElementById("stat-calls-count");
  if (statCalls) {
    statCalls.innerText = callsCount;
  }
}

function endCallSimulator() {
  const callModal = document.getElementById("call-modal");
  callModal.classList.remove("active");
}
