// DOM Elements
const quoteDisplay = document.getElementById("quoteDisplay");
const showQuoteBtn = document.getElementById("newQuote");
const notification = document.getElementById("notification");
const conflictResolution = document.getElementById("conflictResolution");

// Load quotes from localStorage or use fallback
function loadQuotesFromStorage() {
  const storedQuotes = localStorage.getItem("quotes");
  return storedQuotes ? JSON.parse(storedQuotes) : [
    { id: 1, text: "The best way to predict the future is to create it.", category: "Motivation" },
    { id: 2, text: "Simplicity is the ultimate sophistication.", category: "Design" },
    { id: 3, text: "JavaScript is the duct tape of the Internet.", category: "Programming" }
  ];
}

let quotes = loadQuotesFromStorage();
let serverQuotes = [];

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Fetch quotes from server (JSONPlaceholder)
async function fetchQuotesFromServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    const data = await response.json();
    serverQuotes = data.slice(0, 5).map((post, index) => ({
      id: post.id,
      text: post.title,
      category: ["Motivation", "Design", "Programming", "Inspiration", "Life"][index % 5]
    }));
    notification.textContent = "Fetched quotes from server.";
    syncQuotes();
  } catch (error) {
    notification.textContent = "Error fetching server quotes.";
    console.error(error);
  }
}

// Sync local quotes with server
function syncQuotes() {
  const conflicts = [];
  const mergedQuotes = [...quotes];

  serverQuotes.forEach(serverQuote => {
    const localQuote = quotes.find(q => q.id === serverQuote.id);
    if (localQuote) {
      if (localQuote.text !== serverQuote.text || localQuote.category !== serverQuote.category) {
        conflicts.push({ server: serverQuote, local: localQuote });
      }
    } else {
      mergedQuotes.push(serverQuote);
    }
  });

  if (conflicts.length > 0) {
    notification.textContent = Conflicts detected: ${conflicts.length} quotes differ.;
    conflictResolution.style.display = "block";
  } else {
    quotes = mergedQuotes;
    saveQuotes();
    populateCategories();
    filterQuotes();
    notification.textContent = "Quotes synced with server!";
  }
}

// Manual conflict resolution
function resolveConflict(source) {
  if (source === "server") {
    serverQuotes.forEach(serverQuote => {
      const index = quotes.findIndex(q => q.id === serverQuote.id);
      if (index !== -1) {
        quotes[index] = serverQuote;
      } else {
        quotes.push(serverQuote);
      }
    });
  }
  saveQuotes();
  populateCategories();
  filterQuotes();
  notification.textContent = Conflicts resolved using ${source} data.;
  conflictResolution.style.display = "none";
}

// Periodic sync (every 30 seconds)
setInterval(fetchQuotesFromServer, 30000);

// Initial server fetch
fetchQuotesFromServer();

// Show a random quote
function showRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];
  quoteDisplay.innerHTML = "${randomQuote.text}" - (${randomQuote.category});
  sessionStorage.setItem("lastQuote", JSON.stringify(randomQuote));
}

// Add a new quote
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const newText = textInput.value.trim();
  const newCategory = categoryInput.value.trim();

  if (!newText || !newCategory) {
    alert("Please fill in both fields.");
    return;
  }

  const newQuote = { id: Date.now(), text: newText, category: newCategory };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  textInput.value = "";
  categoryInput.value = "";
  notification.textContent = "Quote added locally.";
  postToServer(newQuote);
}

// Post to server
async function postToServer(quote) {
  try {
    await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: quote.id, title: quote.text, category: quote.category })
    });
    notification.textContent = "Quote synced to server.";
  } catch (error) {
    notification.textContent = "Error syncing quote to server.";
    console.error(error);
  }
}

// Create Add Quote Form
function createAddQuoteForm() {
  const formContainer = document.createElement("div");

  const textInput = document.createElement("input");
  textInput.id = "newQuoteText";
  textInput.type = "text";
  textInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";

  const addButton = document.createElement("button");
  addButton.textContent = "Add Quote";
  addButton.onclick = addQuote;

  formContainer.appendChild(textInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addButton);

  document.body.appendChild(formContainer);
}

// Export to JSON
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
}

// Import from JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (event) {
    try {
      const importedQuotes = JSON.parse(event.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes.map(q => ({ ...q, id: q.id || Date.now() })));
        saveQuotes();
        populateCategories();
        notification.textContent = "Quotes imported successfully.";
        importedQuotes.forEach(postToServer);
      } else {
        notification.textContent = "Invalid file format.";
      }
    } catch (error) {
      notification.textContent = "Error parsing file.";
      console.error(error);
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// Populate categories for filtering
function populateCategories() {
  const select = document.getElementById("categoryFilter");
  if (!select) return;

  const uniqueCategories = [...new Set(quotes.map(q => q.category))];
  select.innerHTML = "<option value=\"all\">All Categories</option>";
  uniqueCategories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

// Filter quotes
function filterQuotes() {
  const category = document.getElementById("categoryFilter").value;
  const filtered = category === "all" ? quotes : quotes.filter(q => q.category === category);
  if (filtered.length > 0) {
    const quote = filtered[Math.floor(Math.random() * filtered.length)];
    quoteDisplay.innerHTML = "${quote.text}" - (${quote.category});
  } else {
    quoteDisplay.innerHTML = "No quotes in this category.";
  }
  localStorage.setItem("selectedCategory", category);
}

// Initial Load
window.onload = function () {
  const savedQuote = sessionStorage.getItem("lastQuote");
  if (savedQuote) {
    const quote = JSON.parse(savedQuote);
    quoteDisplay.innerHTML = "${quote.text}" - (${quote.category});
  } else {
    showRandomQuote();
  }

  createAddQuoteForm();
  populateCategories();

  const selectedCategory = localStorage.getItem("selectedCategory");
  if (selectedCategory && document.getElementById("categoryFilter")) {
    document.getElementById("categoryFilter").value = selectedCategory;
    filterQuotes();
  }
};

// Event listener for Show New Quote
showQuoteBtn.addEventListener("click", showRandomQuote);