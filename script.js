/* =============================================
   LIBRARY MANAGEMENT SYSTEM — script.js
   All application logic: data, rendering,
   search, forms, borrow/return, localStorage.
   ============================================= */

// ──────────────────────────────────────────────
//  1.  SAMPLE DATA
//      Pre-loaded books that appear when the app
//      runs for the first time.
// ──────────────────────────────────────────────
const SAMPLE_BOOKS = [
  { id: 1, title: "To Kill a Mockingbird",       author: "Harper Lee",            category: "Fiction",     isbn: "978-0-06-112008-4", available: true  },
  { id: 2, title: "1984",                        author: "George Orwell",         category: "Dystopian",   isbn: "978-0-452-28423-4", available: true  },
  { id: 3, title: "The Great Gatsby",            author: "F. Scott Fitzgerald",   category: "Fiction",     isbn: "978-0-7432-7356-5", available: true  },
  { id: 4, title: "A Brief History of Time",     author: "Stephen Hawking",       category: "Science",     isbn: "978-0-553-38016-3", available: true  },
  { id: 5, title: "Pride and Prejudice",         author: "Jane Austen",           category: "Romance",     isbn: "978-0-14-143951-8", available: true  },
  { id: 6, title: "The Art of War",              author: "Sun Tzu",               category: "Philosophy",  isbn: "978-1-59030-225-9", available: true  },
  { id: 7, title: "Sapiens",                     author: "Yuval Noah Harari",     category: "History",     isbn: "978-0-06-231609-7", available: true  },
  { id: 8, title: "Clean Code",                  author: "Robert C. Martin",      category: "Technology",  isbn: "978-0-13-235088-4", available: true  },
];

// ──────────────────────────────────────────────
//  2.  APPLICATION STATE
//      These arrays are the "single source of
//      truth" and are synced with localStorage.
// ──────────────────────────────────────────────
let books      = [];   // Array of book objects
let members    = [];   // Array of member objects
let records    = [];   // Borrow/return records
let activities = [];   // Recent-activity log entries
let nextBookId   = 9;  // Auto-increment counter
let nextMemberId = 1;

// ──────────────────────────────────────────────
//  3.  LOCAL-STORAGE HELPERS
//      Save & load the entire state so data
//      survives page reloads.
// ──────────────────────────────────────────────

/** Save all application state to localStorage */
function saveState() {
  localStorage.setItem("lib_books",        JSON.stringify(books));
  localStorage.setItem("lib_members",      JSON.stringify(members));
  localStorage.setItem("lib_records",      JSON.stringify(records));
  localStorage.setItem("lib_activities",   JSON.stringify(activities));
  localStorage.setItem("lib_nextBookId",   JSON.stringify(nextBookId));
  localStorage.setItem("lib_nextMemberId", JSON.stringify(nextMemberId));
}

/** Load state from localStorage, or fall back to sample data */
function loadState() {
  const storedBooks = localStorage.getItem("lib_books");

  if (storedBooks) {
    // Returning user — restore saved data
    books        = JSON.parse(storedBooks);
    members      = JSON.parse(localStorage.getItem("lib_members"))      || [];
    records      = JSON.parse(localStorage.getItem("lib_records"))      || [];
    activities   = JSON.parse(localStorage.getItem("lib_activities"))   || [];
    nextBookId   = JSON.parse(localStorage.getItem("lib_nextBookId"))   || books.length + 1;
    nextMemberId = JSON.parse(localStorage.getItem("lib_nextMemberId")) || members.length + 1;
  } else {
    // First visit — seed with sample books
    books = SAMPLE_BOOKS.map(function (book) {
      return Object.assign({}, book);   // shallow copy each object
    });
    nextBookId = books.length + 1;
    saveState();
  }
}

// ──────────────────────────────────────────────
//  4.  DOM REFERENCES
//      Grab every element we need once at startup.
// ──────────────────────────────────────────────
const dom = {};

function cacheDom() {
  // Navigation
  dom.navLinks = document.querySelectorAll(".nav-link");
  dom.sections = document.querySelectorAll(".page-section");

  // Dashboard stats
  dom.totalBooksCount     = document.getElementById("totalBooksCount");
  dom.availableBooksCount = document.getElementById("availableBooksCount");
  dom.borrowedBooksCount  = document.getElementById("borrowedBooksCount");
  dom.totalMembersCount   = document.getElementById("totalMembersCount");

  // Activity
  dom.activityList  = document.getElementById("activityList");
  dom.noActivityMsg = document.getElementById("noActivityMsg");

  // Catalogue
  dom.searchInput    = document.getElementById("searchInput");
  dom.categoryFilter = document.getElementById("categoryFilter");
  dom.bookList       = document.getElementById("bookList");
  dom.noBooksMsg     = document.getElementById("noBooksMsg");

  // Add Book form
  dom.addBookForm = document.getElementById("addBookForm");
  dom.bookTitle   = document.getElementById("bookTitle");
  dom.bookAuthor  = document.getElementById("bookAuthor");
  dom.bookCategory = document.getElementById("bookCategory");
  dom.bookISBN    = document.getElementById("bookISBN");
  dom.addBookMsg  = document.getElementById("addBookMsg");

  // Member Registration form
  dom.registerMemberForm = document.getElementById("registerMemberForm");
  dom.memberName   = document.getElementById("memberName");
  dom.memberEmail  = document.getElementById("memberEmail");
  dom.memberPhone  = document.getElementById("memberPhone");
  dom.registerMemberMsg = document.getElementById("registerMemberMsg");
  dom.membersList  = document.getElementById("membersList");
  dom.noMembersMsg = document.getElementById("noMembersMsg");

  // Borrow / Return
  dom.borrowForm         = document.getElementById("borrowForm");
  dom.borrowBookSelect   = document.getElementById("borrowBookSelect");
  dom.borrowMemberSelect = document.getElementById("borrowMemberSelect");
  dom.borrowMsg          = document.getElementById("borrowMsg");

  dom.returnForm       = document.getElementById("returnForm");
  dom.returnBookSelect = document.getElementById("returnBookSelect");
  dom.returnMsg        = document.getElementById("returnMsg");

  // Records table
  dom.recordsBody   = document.getElementById("recordsBody");
  dom.noRecordsMsg  = document.getElementById("noRecordsMsg");

  // Toast
  dom.toast = document.getElementById("toast");
}

// ──────────────────────────────────────────────
//  5.  NAVIGATION (Section Switching)
// ──────────────────────────────────────────────

/** Show only the selected section and highlight its nav link */
function navigateTo(sectionId) {
  dom.sections.forEach(function (sec) {
    sec.classList.remove("active-section");
  });
  dom.navLinks.forEach(function (link) {
    link.classList.remove("active");
  });

  var target = document.getElementById(sectionId);
  if (target) {
    target.classList.add("active-section");
  }

  // Highlight matching nav link
  dom.navLinks.forEach(function (link) {
    if (link.dataset.section === sectionId) {
      link.classList.add("active");
    }
  });
}

/** Attach click handlers to every nav link */
function setupNavigation() {
  dom.navLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      navigateTo(link.dataset.section);
    });
  });
}

// ──────────────────────────────────────────────
//  6.  TOAST NOTIFICATIONS
// ──────────────────────────────────────────────

/** Display a brief pop-up message at the bottom-right */
function showToast(message, type) {
  // type: "success" | "error" | "info"
  dom.toast.textContent = message;
  dom.toast.className = "toast toast-" + type + " show";
  dom.toast.hidden = false;

  // Hide after 3 seconds
  setTimeout(function () {
    dom.toast.classList.remove("show");
    // Fully hide after transition ends
    setTimeout(function () {
      dom.toast.hidden = true;
    }, 350);
  }, 3000);
}

// ──────────────────────────────────────────────
//  7.  DASHBOARD RENDERING
// ──────────────────────────────────────────────

/** Update the four stat counters on the Dashboard */
function updateDashboard() {
  var totalBooks     = books.length;
  var availableBooks = books.filter(function (b) { return b.available; }).length;
  var borrowedBooks  = totalBooks - availableBooks;
  var totalMembers   = members.length;

  dom.totalBooksCount.textContent     = totalBooks;
  dom.availableBooksCount.textContent = availableBooks;
  dom.borrowedBooksCount.textContent  = borrowedBooks;
  dom.totalMembersCount.textContent   = totalMembers;

  // Render activity log
  renderActivityLog();
}

/** Render the list of recent activities */
function renderActivityLog() {
  dom.activityList.innerHTML = "";

  if (activities.length === 0) {
    dom.noActivityMsg.hidden = false;
    return;
  }

  dom.noActivityMsg.hidden = true;

  // Show newest first, limit to 20
  var recent = activities.slice(-20).reverse();
  recent.forEach(function (entry) {
    var li = document.createElement("li");
    li.innerHTML = entry.text + ' <span class="activity-time">' + entry.time + "</span>";
    dom.activityList.appendChild(li);
  });
}

/** Add an entry to the activity log */
function logActivity(text) {
  var now = new Date();
  var timeStr = now.toLocaleString();
  activities.push({ text: text, time: timeStr });
  saveState();
}

// ──────────────────────────────────────────────
//  8.  CATALOGUE RENDERING
// ──────────────────────────────────────────────

/** Render book cards into the catalogue grid */
function renderBooks(bookArray) {
  dom.bookList.innerHTML = "";

  if (bookArray.length === 0) {
    dom.noBooksMsg.hidden = false;
    return;
  }

  dom.noBooksMsg.hidden = true;

  bookArray.forEach(function (book) {
    var card = document.createElement("article");
    card.className = "book-card";
    card.innerHTML =
      '<span class="book-title">' + escapeHtml(book.title) + "</span>" +
      '<span class="book-author">by ' + escapeHtml(book.author) + "</span>" +
      '<span class="book-category">' + escapeHtml(book.category) + "</span>" +
      (book.isbn ? '<span class="book-isbn">ISBN: ' + escapeHtml(book.isbn) + "</span>" : "") +
      '<span class="book-status ' + (book.available ? "available" : "borrowed") + '">' +
      (book.available ? "✅ Available" : "📤 Borrowed") +
      "</span>";
    dom.bookList.appendChild(card);
  });
}

/** Populate the category dropdown from existing book data */
function populateCategoryFilter() {
  // Collect unique categories
  var categories = [];
  books.forEach(function (book) {
    if (categories.indexOf(book.category) === -1) {
      categories.push(book.category);
    }
  });
  categories.sort();

  // Preserve the current selection if possible
  var current = dom.categoryFilter.value;
  dom.categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(function (cat) {
    var option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    dom.categoryFilter.appendChild(option);
  });

  // Restore selection
  if (current && categories.indexOf(current) !== -1) {
    dom.categoryFilter.value = current;
  }
}

/** Apply search text and category filter, then re-render */
function filterBooks() {
  var query    = dom.searchInput.value.trim().toLowerCase();
  var category = dom.categoryFilter.value;

  var filtered = books.filter(function (book) {
    // Category match
    var catMatch = (category === "all") || (book.category === category);

    // Search match (title or author)
    var searchMatch = true;
    if (query) {
      searchMatch =
        book.title.toLowerCase().indexOf(query)  !== -1 ||
        book.author.toLowerCase().indexOf(query) !== -1;
    }

    return catMatch && searchMatch;
  });

  renderBooks(filtered);
}

// ──────────────────────────────────────────────
//  9.  ADD BOOK
// ──────────────────────────────────────────────

function handleAddBook(event) {
  event.preventDefault();
  clearFormMessage(dom.addBookMsg);
  clearInvalidStyles(dom.addBookForm);

  var title    = dom.bookTitle.value.trim();
  var author   = dom.bookAuthor.value.trim();
  var category = dom.bookCategory.value.trim();
  var isbn     = dom.bookISBN.value.trim();

  // ── Validation ──
  var errors = [];
  if (!title)    { errors.push("Title is required.");    dom.bookTitle.classList.add("invalid"); }
  if (!author)   { errors.push("Author is required.");   dom.bookAuthor.classList.add("invalid"); }
  if (!category) { errors.push("Category is required."); dom.bookCategory.classList.add("invalid"); }

  if (errors.length > 0) {
    showFormMessage(dom.addBookMsg, errors.join(" "), "error");
    return;
  }

  // Check for duplicate title+author
  var duplicate = books.some(function (b) {
    return b.title.toLowerCase() === title.toLowerCase() &&
           b.author.toLowerCase() === author.toLowerCase();
  });

  if (duplicate) {
    showFormMessage(dom.addBookMsg, "A book with this title and author already exists.", "error");
    return;
  }

  // ── Create & store ──
  var newBook = {
    id: nextBookId++,
    title: title,
    author: author,
    category: category,
    isbn: isbn || "",
    available: true,
  };

  books.push(newBook);
  saveState();

  logActivity("Book added: <strong>" + escapeHtml(title) + "</strong>");

  // ── Update UI ──
  dom.addBookForm.reset();
  populateCategoryFilter();
  filterBooks();
  updateBorrowReturnSelects();
  updateDashboard();
  showFormMessage(dom.addBookMsg, "Book \"" + title + "\" added successfully!", "success");
  showToast("Book added!", "success");
}

// ──────────────────────────────────────────────
//  10.  MEMBER REGISTRATION
// ──────────────────────────────────────────────

function handleRegisterMember(event) {
  event.preventDefault();
  clearFormMessage(dom.registerMemberMsg);
  clearInvalidStyles(dom.registerMemberForm);

  var name  = dom.memberName.value.trim();
  var email = dom.memberEmail.value.trim();
  var phone = dom.memberPhone.value.trim();

  // ── Validation ──
  var errors = [];
  if (!name)  { errors.push("Name is required.");  dom.memberName.classList.add("invalid"); }
  if (!email) { errors.push("Email is required."); dom.memberEmail.classList.add("invalid"); }

  // Simple email format check
  if (email && !isValidEmail(email)) {
    errors.push("Please enter a valid email address.");
    dom.memberEmail.classList.add("invalid");
  }

  if (errors.length > 0) {
    showFormMessage(dom.registerMemberMsg, errors.join(" "), "error");
    return;
  }

  // Check for duplicate email
  var duplicate = members.some(function (m) {
    return m.email.toLowerCase() === email.toLowerCase();
  });

  if (duplicate) {
    showFormMessage(dom.registerMemberMsg, "A member with this email already exists.", "error");
    return;
  }

  // ── Create & store ──
  var newMember = {
    id: nextMemberId++,
    name: name,
    email: email,
    phone: phone || "",
  };

  members.push(newMember);
  saveState();

  logActivity("Member registered: <strong>" + escapeHtml(name) + "</strong>");

  // ── Update UI ──
  dom.registerMemberForm.reset();
  renderMembers();
  updateBorrowReturnSelects();
  updateDashboard();
  showFormMessage(dom.registerMemberMsg, "Member \"" + name + "\" registered!", "success");
  showToast("Member registered!", "success");
}

/** Render the member list below the registration form */
function renderMembers() {
  dom.membersList.innerHTML = "";

  if (members.length === 0) {
    dom.noMembersMsg.hidden = false;
    return;
  }

  dom.noMembersMsg.hidden = true;

  members.forEach(function (m) {
    var li = document.createElement("li");
    li.innerHTML =
      "<strong>" + escapeHtml(m.name) + "</strong> " +
      '<span class="member-email">&lt;' + escapeHtml(m.email) + "&gt;</span>" +
      (m.phone ? ' <span class="member-phone">📞 ' + escapeHtml(m.phone) + "</span>" : "") +
      ' <span class="member-id">ID: M' + m.id + "</span>";
    dom.membersList.appendChild(li);
  });
}

// ──────────────────────────────────────────────
//  11.  BORROW & RETURN
// ──────────────────────────────────────────────

/** Populate the borrow/return dropdowns with current data */
function updateBorrowReturnSelects() {
  // Available books for borrowing
  dom.borrowBookSelect.innerHTML = '<option value="">— Choose an available book —</option>';
  books.forEach(function (book) {
    if (book.available) {
      var opt = document.createElement("option");
      opt.value = book.id;
      opt.textContent = book.title + " — " + book.author;
      dom.borrowBookSelect.appendChild(opt);
    }
  });

  // Members for borrowing
  dom.borrowMemberSelect.innerHTML = '<option value="">— Choose a member —</option>';
  members.forEach(function (m) {
    var opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.name + " (" + m.email + ")";
    dom.borrowMemberSelect.appendChild(opt);
  });

  // Borrowed books for returning
  dom.returnBookSelect.innerHTML = '<option value="">— Choose a borrowed book —</option>';
  books.forEach(function (book) {
    if (!book.available) {
      var opt = document.createElement("option");
      opt.value = book.id;
      opt.textContent = book.title + " — " + book.author;
      dom.returnBookSelect.appendChild(opt);
    }
  });
}

function handleBorrow(event) {
  event.preventDefault();
  clearFormMessage(dom.borrowMsg);

  var bookId   = parseInt(dom.borrowBookSelect.value, 10);
  var memberId = parseInt(dom.borrowMemberSelect.value, 10);

  // ── Validation ──
  if (!bookId || !memberId) {
    showFormMessage(dom.borrowMsg, "Please select both a book and a member.", "error");
    return;
  }

  // Find the book and mark as borrowed
  var book = books.find(function (b) { return b.id === bookId; });
  var member = members.find(function (m) { return m.id === memberId; });

  if (!book || !book.available) {
    showFormMessage(dom.borrowMsg, "This book is no longer available.", "error");
    return;
  }

  if (!member) {
    showFormMessage(dom.borrowMsg, "Member not found.", "error");
    return;
  }

  // ── Update state ──
  book.available = false;

  var record = {
    bookId: book.id,
    bookTitle: book.title,
    memberId: member.id,
    memberName: member.name,
    borrowedDate: new Date().toLocaleDateString(),
    status: "active",
  };

  records.push(record);
  saveState();

  logActivity("<strong>" + escapeHtml(member.name) + "</strong> borrowed <strong>" + escapeHtml(book.title) + "</strong>");

  // ── Update UI ──
  dom.borrowForm.reset();
  filterBooks();
  updateBorrowReturnSelects();
  renderRecords();
  updateDashboard();
  showFormMessage(dom.borrowMsg, "\"" + book.title + "\" borrowed by " + member.name + ".", "success");
  showToast("Book borrowed!", "info");
}

function handleReturn(event) {
  event.preventDefault();
  clearFormMessage(dom.returnMsg);

  var bookId = parseInt(dom.returnBookSelect.value, 10);

  // ── Validation ──
  if (!bookId) {
    showFormMessage(dom.returnMsg, "Please select a book to return.", "error");
    return;
  }

  // Find the book and mark as available
  var book = books.find(function (b) { return b.id === bookId; });

  if (!book || book.available) {
    showFormMessage(dom.returnMsg, "This book is not currently borrowed.", "error");
    return;
  }

  // ── Update state ──
  book.available = true;

  // Update the most recent active record for this book
  for (var i = records.length - 1; i >= 0; i--) {
    if (records[i].bookId === bookId && records[i].status === "active") {
      records[i].status = "returned";
      records[i].returnedDate = new Date().toLocaleDateString();
      break;
    }
  }

  saveState();

  logActivity("<strong>" + escapeHtml(book.title) + "</strong> returned");

  // ── Update UI ──
  dom.returnForm.reset();
  filterBooks();
  updateBorrowReturnSelects();
  renderRecords();
  updateDashboard();
  showFormMessage(dom.returnMsg, "\"" + book.title + "\" has been returned.", "success");
  showToast("Book returned!", "success");
}

/** Render borrowing records into the table */
function renderRecords() {
  dom.recordsBody.innerHTML = "";

  if (records.length === 0) {
    dom.noRecordsMsg.hidden = false;
    dom.recordsBody.parentElement.style.display = "none";
    return;
  }

  dom.noRecordsMsg.hidden = true;
  dom.recordsBody.parentElement.style.display = "";

  // Show newest first
  var sorted = records.slice().reverse();
  sorted.forEach(function (rec) {
    var tr = document.createElement("tr");
    var statusClass = rec.status === "active" ? "status-active" : "status-returned";
    var statusText  = rec.status === "active" ? "Borrowed" : "Returned";

    tr.innerHTML =
      "<td>" + escapeHtml(rec.bookTitle) + "</td>" +
      "<td>" + escapeHtml(rec.memberName) + "</td>" +
      "<td>" + rec.borrowedDate + "</td>" +
      '<td class="' + statusClass + '">' + statusText + "</td>";
    dom.recordsBody.appendChild(tr);
  });
}

// ──────────────────────────────────────────────
//  12.  UTILITY FUNCTIONS
// ──────────────────────────────────────────────

/** Prevent XSS by escaping HTML special characters */
function escapeHtml(text) {
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

/** Basic email format validation */
function isValidEmail(email) {
  // A simple regex that covers common email formats
  var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

/** Show a message below a form */
function showFormMessage(element, text, type) {
  element.textContent = text;
  element.className = "form-message " + type;
}

/** Clear the text of a form message element */
function clearFormMessage(element) {
  element.textContent = "";
  element.className = "form-message";
}

/** Remove .invalid class from all inputs in a form */
function clearInvalidStyles(form) {
  var inputs = form.querySelectorAll("input, select");
  inputs.forEach(function (input) {
    input.classList.remove("invalid");
  });
}

// ──────────────────────────────────────────────
//  13.  EVENT LISTENERS
// ──────────────────────────────────────────────

function setupEventListeners() {
  // Forms
  dom.addBookForm.addEventListener("submit", handleAddBook);
  dom.registerMemberForm.addEventListener("submit", handleRegisterMember);
  dom.borrowForm.addEventListener("submit", handleBorrow);
  dom.returnForm.addEventListener("submit", handleReturn);

  // Search & filter (live updates as the user types)
  dom.searchInput.addEventListener("input", filterBooks);
  dom.categoryFilter.addEventListener("change", filterBooks);
}

// ──────────────────────────────────────────────
//  14.  INITIALISATION
//      Called once when the page finishes loading.
// ──────────────────────────────────────────────

function init() {
  cacheDom();           // Cache DOM references
  loadState();          // Restore data from localStorage
  setupNavigation();    // Wire up nav links
  setupEventListeners();// Wire up forms, search, filter

  // Render everything
  populateCategoryFilter();
  filterBooks();
  renderMembers();
  updateBorrowReturnSelects();
  renderRecords();
  updateDashboard();
}

// Start the app when the DOM is ready
document.addEventListener("DOMContentLoaded", init);
