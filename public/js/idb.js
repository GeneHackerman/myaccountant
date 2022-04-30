// create variable to hold db connection
let db;
// establish a connection to IndexedDB database
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if database ver changes
request.oneupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// upon a successful
request.onsuccess = function (event) {
    // db successfully created with object store
    // or simply established a connection, save reference to db in global variable
    db = event.target.result;
    // check if app is online
    // sends local db data to api
    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// will execute if attempt to submit new transaction and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access the object store
    const budgetObjectStore = transaction.objectStore('new_transaction');

    // add record to your store with add method
    budgetObjectStore.add(record);
};

// function that will handle collecting all of the data
function uploadTransaction() {
    // open transaction on your db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access your object store
    const budgetObjectStore =  transaction.objectStore('new_transaction');

    // get all transactions from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    // upon a successful .getAll() execution, run this function
    getAll.onsuccess = function() {
        // if there was data in indexedb's store, let's send it to api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST', 
                body: JSON.stringify(getAll.results), 
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
              .then(respons => respons.json())
              .then(serverResponse => {
                  if (serverResponse.message) {
                      throw new Error(serverResponse);
                  }
                  // open on more transaction
                  const transaction = db.transaction(['new_transaction'], 'readwrite');
                  // access the object store
                  const budgetObjectStore = transaction.objectStore('new_transaction');
                  // clear all items in your store
                  budgetObjectStore.clear();

                  alert('All saved transaction have been submitted!');
              })
              .catch(err => {
                  console.log(err);
              });
        }
    }
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);