document.addEventListener('DOMContentLoaded', () => {
});


const saveUrlsContent = async () => {
    showLoder()
    let urlsInput = document.getElementById('urls');

    let urls = urlsInput.value.trim()
    if (urls == "") { }
    else {
        urls = urls.split('\n').map(url => url.trim());

        if (!urls.length) return;

        try {
            for (const url of urls) {
                const response = await fetch(`/save?url=${encodeURIComponent(url)}`);
                const data = await response.json();
                urlsInput.value = '';
                console.log(data);
                displayFiles();
                showAlert("info", "URL content has been saved successfully!", "alert-container")
            }
        } catch (error) {
            showAlert("warning", `Saving URL content failed. ${error}`, "alert-container")
            console.error('Failed to save URLs content ' + error);
        }
    }
    hideLoder()
};

const saveTextAsFile = async () => {
    showLoder()
    const textInput = document.getElementById('text-input');

    const text = textInput.value.trim();
    if (text == "") { }
    else {
        console.log('OK')
        try {
            const response = await fetch(`/save-text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: text })
            });
            const data = await response.json();

            setTimeout(() => {
                hideLoder()
                showAlert("info", "Provided content has been saved successfully!", "alert-container")

            }, 2000);

            textInput.value = '';
            console.log(data);
            displayFiles();

        } catch (error) {
            console.error('Failed to save text as file', error);
            setTimeout(() => {
                hideLoder()
                showAlert("warning", `Saving Provided content failed! ${error}`, "alert-container")
            }, 2000);

        }
    }

};

const uploadFiles = async () => {
    showLoder()

    const uploadResponse = document.getElementById('upload-response');
    const uploadForm = document.getElementById('upload-form');
    const filesInput = document.getElementById('files-input');
    const formData = new FormData(uploadForm);

    // Check if any files are selected
    if (filesInput.files.length === 0) {
        // Do nothing if no file is selected
    }
    else {

        try {
            const response = await fetch('/upload-files', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            uploadResponse.innerHTML = `<div>${data.message}</div>`;
            // Unselect all selected files
            filesInput.value = null;

            displayFiles();
            setTimeout(() => {
                showAlert("info", "The files have been uploaded successfully!", "alert-container")
            }, 2000);

        } catch (error) {
            console.error('Failed to upload files', error);
            setTimeout(() => {
                showAlert("info", `Failed to upload files! ${error}`, "alert-container")
            }, 2000);

        }
    }
    setTimeout(() => {
        hideLoder()
    }, 2000);

};





const addData = () => {


    try { saveUrlsContent() } catch (err) { console.log(err) }
    try { saveTextAsFile() } catch (err) { }
    try { uploadFiles() } catch (err) { }

}

const cancelData = () => {
    const urlsInput = document.getElementById('urls');
    const textInput = document.getElementById('text-input');
    const filesInput = document.getElementById('files-input');

    // Clear the text areas
    urlsInput.value = '';
    textInput.value = '';

    // Unselect all selected files
    filesInput.value = null;
};


// display files 

// Function to fetch files from the backend
async function fetchFiles() {
    try {
        const response = await fetch('/list-files');
        if (!response.ok) {
            throw new Error('Failed to fetch files');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching files:', error);
        return [];
    }
}

// Function to delete a file
async function deleteFile(fileName, fileId, mode = "one") {

    if (mode == "one") {
        showLoder()

    }
    try {
        const response = await fetch(`/delete-file/${fileName}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete file');
        }
        console.log(`File '${fileName}' deleted successfully`);
        // Remove the row from the table
        const row = document.getElementById(`file-${fileId}`);
        if (row) {
            row.remove();
        }

        if (mode == "one") {
            setTimeout(() => {
                showAlert("info", "The file has been deleted successfully!", "alert-container-files")
            }, 2000);
        }

    } catch (error) {
        console.error('Error deleting file:', error);
        if (mode == "one") {

            setTimeout(() => {
                showAlert("info", "The file Deletion Failed!", "alert-container-files")
            }, 2000);
        }

    }

    if (mode == "one") {

        setTimeout(() => {
            hideLoder()
        }, 2000);
    }
}


// Function to delete all files
async function deleteAllFiles() {
    showLoder()
    try {
        const files = await fetchFiles();
        if (files.length === 0) {
            console.log('No files to delete');
            return;
        }
        files.forEach(async (file, index) => {
            await deleteFile(file.name, index + 1, "all");
        });

        setTimeout(() => {
            showAlert("info", "The files have been deleted successfully!", "alert-container-files")
        }, 2000);

    } catch (error) {
        console.error('Error deleting all files:', error);
        setTimeout(() => {
            showAlert("info", "The files Deletion Failed!", "alert-container-files")
        }, 2000);

    }

    setTimeout(() => {
        hideLoder()
    }, 2000);

}


// Function to display files in the table
async function displayFiles() {
    const files = await fetchFiles();
    const tbody = document.getElementById('files-table-body');
    tbody.innerHTML = ''; // Clear existing table rows
    files.forEach((file, index) => {
        const row = `
            <tr id="file-${index + 1}">
                <th scope="row">${index + 1}</th>
                <td>${file.name}</td>
                <td>${file.created_at}</td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteFile('${file.name}', ${index + 1})">X</button></td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}



// Function to trigger ingestion of all data files
async function ingestAllData() {

    const files = await fetchFiles();

    if (files.length > 0) {
        showLoder()
        try {
            // Perform an HTTP POST request to the FastAPI endpoint
            const response = await fetch('/ingest-all', {
                method: 'GET', // Assuming the route accepts GET method
                headers: {
                    'Content-Type': 'application/json',
                    // Add any additional headers if required
                },
            });

            // Parse the JSON response
            const data = await response.json();

            // Check if the response is successful
            if (response.ok) {
                // Handle successful response
                console.log('Response:', data.message);
                setTimeout(() => {
                    hideLoder()
                    checkIngestionStatus()
                    showAlert("info", "Data ingestion has been successfully updated!", "alert-container-ingestion")
                }, 2000);
            } else {
                // Handle error response
                console.error('Error:', data.message);
                setTimeout(() => {
                    hideLoder()
                    checkIngestionStatus()
                    showAlert("info", "Data ingestion has been Failed!", "alert-container-ingestion")
                }, 2000);
            }

        } catch (error) {
            // Handle network error
            console.error('Error:', error);
            // Optionally, you can show an error message or update the UI
            setTimeout(() => {
                hideLoder()
                showAlert("info", "Data ingestion failed!", "alert-container-ingestion")
            }, 2000);

        }
    }
    else {
        showAlert("warning", "There are no files available for ingestion!", "alert-container-ingestion")
    }
}


// Function to delete all ingestions
async function deleteAllIngestions() {
    showLoder()
    try {
        // Perform an HTTP GET request to the FastAPI endpoint
        const response = await fetch('/delete-all-ingestions', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Add any additional headers if required
            },
        });

        // Parse the JSON response
        const data = await response.json();

        // Check if the response is successful
        if (response.ok) {
            // Handle successful response
            console.log('Response:', data.message);

            setTimeout(() => {
                checkIngestionStatus()
                showAlert("info", data.message, "alert-container-ingestion")
            }, 2000);

            // Optionally, you can show a success message or update the UI
        } else {
            // Handle error response
            console.error('Error:', data.message);
            // Optionally, you can show an error message or update the UI
            setTimeout(() => {
                checkIngestionStatus()
                showAlert("info", "Data ingestion deletion Failed!", "alert-container-ingestion")
            }, 2000);

        }
    } catch (error) {
        // Handle network error
        console.error('Error:', error);
        setTimeout(() => {
            checkIngestionStatus()
            showAlert("info", "Data ingestion deletion Failed!", "alert-container-ingestion")
        }, 2000);
    }
    setTimeout(() => {
        hideLoder()
    }, 1990);
}


// Call the displayFiles function to initially populate the table
displayFiles();




// check ingestion

// Function to check ingestion status and update UI
async function checkIngestionStatus() {
    try {
        const response = await fetch('/check-ingestion');
        const data = await response.json();

        // Select the elements to update
        const ingestionExistSpan = document.querySelector('.ingestion-exist');
        const ingestionNotExistSpan = document.querySelector('.ingestion-not-exist');
        const deleteButton = document.querySelector('.delete-ingestion-button');

        if (data) {
            // Ingestion exists
            ingestionExistSpan.style.display = 'inline-block';
            ingestionNotExistSpan.style.display = 'none';
            deleteButton.disabled = false; // Enable delete button
        } else {
            // Ingestion does not exist
            ingestionExistSpan.style.display = 'none';
            ingestionNotExistSpan.style.display = 'inline-block';
            deleteButton.disabled = true; // Disable delete button
        }
    } catch (error) {
        console.error('Error checking ingestion status:', error);
    }
}

// Call the function to check ingestion status when the page loads
window.addEventListener('DOMContentLoaded', checkIngestionStatus);

